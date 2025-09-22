import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canUlok } from "@/lib/auth/acl";
import { UlokUpdateSchema } from "@/lib/validations/ulok";

type AnyObj = Record<string, unknown>;
// function pick<T extends AnyObj>(obj: T, keys: readonly string[]): Partial<T> {
//   const out: AnyObj = {};
//   for (const k of keys) if (k in obj) out[k] = obj[k];
//   return out as Partial<T>;
// }

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

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function buildPath(ulokId: string, originalName: string) {
  const ext = originalName.includes(".")
    ? "." + originalName.split(".").pop()!.toLowerCase()
    : "";
  const base = slugify(originalName.replace(/\.[^.]+$/, "")) || "file";
  return `${ulokId}/${Date.now()}-${base}${ext}`;
}

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

  let query = supabase.from("ulok").select("*, users!ulok_users_id_fkey(nama, no_telp), approved_by (nama), updated_by (nama), branch_id( nama)").eq("id", id);

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

  const { id } = params;
  const contentType = req.headers.get("content-type") || "";

  // ========= BRANCH: LOCATION MANAGER (Mode B multipart) =========
  if (user.position_nama === "location manager") {
    if (!contentType.startsWith("multipart/form-data")) {
      return NextResponse.json(
        { error: "Use multipart/form-data for uploading file_intip" },
        { status: 400 }
      );
    }

    // Pastikan row ada, cocok branch
    if (!user.branch_id) {
      return NextResponse.json(
        { error: "Forbidden: user has no branch" },
        { status: 403 }
      );
    }

    const { data: existing, error: existErr } = await supabase
      .from("ulok")
      .select("id, branch_id, file_intip")
      .eq("id", id)
      .eq("branch_id", user.branch_id)
      .single();

    if (existErr || !existing) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "Invalid form-data" }, { status: 400 });
    }

    // Kumpulkan field LM (string) selain file
    const rawManagerFields: Record<string, unknown> = {};
    form.forEach((val, key) => {
      if (key === "file_intip") return;
      if (typeof val === "string" && LM_FIELDS_SET.has(key)) {
        rawManagerFields[key] = val;
      }
    });

    // Ambil file (optional kalau memang harus upload)
    const file = form.get("file_intip");
    let newFilePath: string | undefined;

    if (file instanceof File) {
      if (file.size === 0) {
        return NextResponse.json(
          { error: "Empty file_intip uploaded" },
          { status: 400 }
        );
      }
      // Validasi ukuran (10MB contoh)
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File too large (max 10MB)" },
          { status: 400 }
        );
      }

      const path = buildPath(id, file.name);
      const { error: uploadErr } = await supabase.storage
        .from("file_intip")
        .upload(path, file, { upsert: false });

      if (uploadErr) {
        return NextResponse.json(
          { error: "Upload failed: " + uploadErr.message },
          { status: 500 }
        );
      }
      newFilePath = path;

      // (Opsional) Hapus file lama kalau berbeda:
    } else {
      // Jika Anda ingin file_intip WAJIB di setiap PATCH LM, aktifkan error ini:
      // return NextResponse.json({ error: "file_intip file is required" }, { status: 400 });
    }

    // Susun payload yang akan divalidasi
    const allowedPayload: Record<string, unknown> = {
      ...rawManagerFields,
    };
    if (newFilePath) {
      allowedPayload.file_intip = newFilePath;
    }

    if (Object.keys(allowedPayload).length === 0) {
      return NextResponse.json(
        { error: "No manager fields provided" },
        { status: 400 }
      );
    }

    const validationResult = UlokUpdateSchema.safeParse(allowedPayload);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const errorMessage = Object.entries(fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
        .join("; ");
      return NextResponse.json(
        {
          error: "Validation failed",
          details: errorMessage,
          fieldErrors,
        },
        { status: 422 }
      );
    }

    const validatedPayload = validationResult.data as AnyObj;

    // Approval stamping kalau ada field approval
    const touchingApproval =
      "approval_status" in validatedPayload ||
      "approval_intip" in validatedPayload ||
      "approved_by" in validatedPayload ||
      "approved_at" in validatedPayload;

    if (touchingApproval) {
      if (!validatedPayload.approved_by) {
        validatedPayload.approved_by = user.id;
      }
      if (!validatedPayload.approved_at) {
        validatedPayload.approved_at = new Date().toISOString();
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from("ulok")
      .update({
        ...validatedPayload,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: updated });
  }

  // ========= BRANCH: LOCATION SPECIALIST (JSON – tanpa file_intip) =========
  if (user.position_nama === "location specialist") {
    if (!contentType.startsWith("application/json")) {
      return NextResponse.json(
        { error: "Use application/json for LS update" },
        { status: 400 }
      );
    }

    const body = (await req.json().catch(() => null)) as AnyObj | null;
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Tolak LM fields (termasuk file_intip)
    const forbiddenLM = (LM_FIELDS as unknown as string[]).filter((k) =>
      Object.prototype.hasOwnProperty.call(body, k)
    );
    if (forbiddenLM.length > 0) {
      return NextResponse.json(
        { error: "LS is not allowed to modify manager fields" },
        { status: 400 }
      );
    }

    const forbiddenKeys = [
      "id",
      "users_id",
      "created_at",
      "created_by",
      "updated_at",
      "updated_by",
      "is_active",
      "branch_id",
      "file_intip",
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

    const validationResult = UlokUpdateSchema.safeParse(allowedPayload);
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      const errorMessage = Object.entries(fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
        .join("; ");
      return NextResponse.json(
        {
          error: "Validation failed",
          details: errorMessage,
          fieldErrors,
        },
        { status: 422 }
      );
    }

    const validatedPayload = validationResult.data;

    const { data: updated, error: updateError } = await supabase
      .from("ulok")
      .update({
        ...validatedPayload,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("users_id", user.id)
      .eq("branch_id", user.branch_id)
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
      .eq("branch_id", user.branch_id)
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
