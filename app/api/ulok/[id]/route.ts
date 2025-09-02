import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canUlok } from "@/lib/auth/acl";

type AnyObj = Record<string, unknown>;
function pick<T extends AnyObj>(obj: T, keys: readonly string[]): Partial<T> {
  const out: AnyObj = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as Partial<T>;
}

function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[]
): Omit<T, K> {
  const out = { ...obj } as T;
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(out, k)) {
      delete out[k];
    }
  }
  return out as Omit<T, K>;
}

// Kolom yang boleh diubah oleh Location Manager
const LM_FIELDS = [
  "approval_intip",
  "tanggal_approval_intip",
  "file_intip",
  "approval_status",
  "approved_at",
  "approved_by",
] as const;

const LM_FIELDS_SET = new Set<string>(LM_FIELDS as unknown as string[]);

// GET /api/ulok/:id
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  //get supabase & user data
  const supabase = await createClient();
  const user = await getCurrentUser();

  //validate user login & authorization
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canUlok("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = params;

  let query = supabase.from("ulok").select("*").eq("id", id);

  //validate query by position
  if (user.position_nama === "location specialist") {
    query = query.eq("users_id", user.id).eq("branch_id", user.branch_id);
  }
  //validate query by branch
  else if (user.position_nama === "location manager") {
    if (!user.branch_id) {
      return NextResponse.json(
        { error: "Forbidden: user has no branch" },
        { status: 403 }
      );
    }
    query = query.eq("branch_id", user.branch_id);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// PATCH /api/ulok/:id
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canUlok("update", user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as AnyObj | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id } = params;

  if (user.position_nama === "location manager") {
    const payloadKeys = Object.keys(body);
    const invalidKeys = payloadKeys.filter((k) => !LM_FIELDS_SET.has(k));
    if (invalidKeys.length > 0) {
      return NextResponse.json(
        {
          error: "LM is only allowed to modify manager fields",
        },
        { status: 400 }
      );
    }

    // LM hanya boleh kolom whitelist
    // 1) Wajib ada minimal satu LM field
    const allowedPayload = pick(
      body,
      LM_FIELDS as unknown as readonly (keyof typeof body)[]
    );
    if (Object.keys(allowedPayload).length === 0) {
      return NextResponse.json(
        {
          error: "No manager fields provided",
        },
        { status: 400 }
      );
    }

    const touchingApproval =
      "approval_status" in allowedPayload ||
      "approval_intip" in allowedPayload ||
      "approved_by" in allowedPayload ||
      "approved_at" in allowedPayload;

    if (touchingApproval) {
      if (!allowedPayload["approved_by"])
        allowedPayload["approved_by"] = user.id;
      if (!allowedPayload["approved_at"])
        allowedPayload["approved_at"] = new Date().toISOString();
    }

    if (!user.branch_id) {
      return NextResponse.json(
        { error: "Forbidden: user has no branch" },
        { status: 403 }
      );
    }
    const { data: check, error: checkErr } = await supabase
      .from("ulok")
      .select("id")
      .eq("id", id)
      .eq("branch_id", user.branch_id)
      .maybeSingle();

    if (checkErr || !check) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("ulok")
      .update({
        ...allowedPayload,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  }

  if (user.position_nama === "location specialist") {
    // 1) Tolak jika payload mengandung LM_FIELDS
    const forbiddenLM = (LM_FIELDS as unknown as string[]).filter((k) =>
      Object.prototype.hasOwnProperty.call(body, k)
    );
    if (forbiddenLM.length > 0) {
      return NextResponse.json(
        {
          error: "LS is not allowed to modify manager fields",
        },
        { status: 400 }
      );
    }

    // 2) Buang kolom sensitif lain agar tidak bisa diubah
    const forbiddenKeys = [
      "id",
      "users_id",
      "created_at",
      "created_by",
      "updated_at",
      "updated_by",
      "is_active",
      // Jika ada branch_id di ulok pada DB Anda, larang juga:
      "branch_id",
    ] as const;

    const allowedPayload = omit(
      body,
      forbiddenKeys as unknown as readonly (keyof typeof body)[]
    );

    if (Object.keys(allowedPayload).length === 0) {
      return NextResponse.json(
        { error: "No permitted fields to update for your role" },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from("ulok")
      .update({
        ...allowedPayload,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("users_id", user.id) // pastikan hanya ulok miliknya
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  }

  return NextResponse.json(
    { error: "Forbidden for your role" },
    { status: 403 }
  );
}

// DELETE /api/ulok/:id
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canUlok("delete", user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  if (user.position_nama === "location specialist") {
    const { data, error } = await supabase
      .from("ulok")
      .delete()
      .eq("id", id)
      .eq("users_id", user.id)
      .eq("branch_id",user.branch_id)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, deleted_id: data?.id ?? id });
  }
  return NextResponse.json(
    { error: "Forbidden for your role" },
    { status: 403 }
  );
}
