/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import {
  NotarisCreateSchema,
  NotarisUpdateSchema,
  stripServerControlledFieldsNotaris,
} from "@/lib/validations/notaris";

const BUCKET = "file_storage";
const FILE_FIELD = "par_online" as const;

function safeName(original: string) {
  return (original || "file.bin")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._-]/g, "");
}

async function resolveUlokIdWithinScope(
  supabase: any,
  progressId: string,
  branchId: string
) {
  const { data, error } = await supabase
    .from("progress_kplt")
    .select(
      `id, kplt:kplt!progress_kplt_kplt_id_fkey!inner ( id, branch_id, ulok_id )`
    )
    .eq("id", progressId)
    .eq("kplt.branch_id", branchId)
    .maybeSingle();

  if (error) throw new Error(error.message ?? "Scope check failed");
  const ulokId = (data as any)?.kplt?.ulok_id as string | null;
  if (!ulokId) throw new Error("Progress not found or out of scope");
  return ulokId;
}

function makeFileKey(ulokId: string, filename: string) {
  return `${ulokId}/notaris/${Date.now()}_${safeName(filename)}`;
}

async function uploadOne(supabase: any, ulokId: string, f: File) {
  const key = makeFileKey(ulokId, f.name || "file.bin");
  const { error } = await supabase.storage.from(BUCKET).upload(key, f, {
    upsert: false,
    contentType: f.type || "application/octet-stream",
    cacheControl: "3600",
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return key;
}

async function removeKeys(supabase: any, keys: string[]) {
  if (!keys.length) return;
  await supabase.storage.from(BUCKET).remove(keys);
}

async function parseMultipartAndUpload(
  supabase: any,
  ulokId: string,
  req: Request
): Promise<{
  payload: Record<string, unknown>;
  newUploadedKey?: string;
  replacedFile?: boolean;
}> {
  const form = await req.formData();
  const payload: Record<string, unknown> = {};
  let newUploadedKey: string | undefined;
  let replacedFile = false;

  const v = form.get(FILE_FIELD);
  if (v instanceof File && v.size > 0) {
    const key = await uploadOne(supabase, ulokId, v);
    payload[FILE_FIELD] = key;
    newUploadedKey = key;
    replacedFile = true;
  } else if (typeof v === "string" && v.trim() !== "") {
    payload[FILE_FIELD] = v.trim();
    replacedFile = true;
  }

  for (const [k, val] of form.entries()) {
    if (k === FILE_FIELD) continue;
    if (typeof val === "string") {
      const t = val.trim();
      if (t !== "") payload[k] = t;
    }
  }

  return { payload, newUploadedKey, replacedFile };
}

// GET /api/progress/[id]/notaris
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  const { data, error } = await supabase.rpc("fn_notaris_get", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
  });

  if (error) {
    const status = (error as any)?.code === "22023" ? 404 : 500;
    return NextResponse.json(
      { error: "Failed to load Notaris", detail: error.message ?? error },
      { status }
    );
  }
  if (!data)
    return NextResponse.json({ error: "Notaris not found" }, { status: 404 });
  return NextResponse.json({ data }, { status: 200 });
}

// POST /api/progress/[id]/notaris
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("create", user) && !canKplt("update", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  let ulokId: string;
  try {
    ulokId = await resolveUlokIdWithinScope(
      supabase,
      progressId,
      user.branch_id
    );
  } catch (e: any) {
    const msg = e?.message || "Scope check failed";
    const status = /out of scope|not found/i.test(msg) ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  const ct = req.headers.get("content-type") || "";
  let payload: Record<string, unknown> = {};
  let uploadedKey: string | undefined;

  try {
    if (ct.includes("multipart/form-data")) {
      const parsed = await parseMultipartAndUpload(supabase, ulokId, req);
      payload = parsed.payload;
      uploadedKey = parsed.newUploadedKey;
    } else {
      const body = await req.json().catch(() => ({}));
      if (
        "id" in body ||
        "progress_kplt_id" in body ||
        "final_status_notaris" in body ||
        "created_at" in body ||
        "updated_at" in body ||
        "tgl_selesai_notaris" in body
      ) {
        return NextResponse.json(
          { error: "Invalid payload: server-controlled fields present" },
          { status: 400 }
        );
      }
      const parsed = NotarisCreateSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      payload = stripServerControlledFieldsNotaris(parsed.data);

      // Jika JSON mengirim par_online, validasi prefix
      const po = (payload as any)?.par_online;
      if (typeof po === "string" && !po.startsWith(`${ulokId}/notaris/`)) {
        return NextResponse.json(
          { error: "Invalid par_online key prefix" },
          { status: 422 }
        );
      }
    }

    const { data, error } = await supabase.rpc("fn_notaris_create", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: progressId,
      p_payload: payload,
    });

    if (error) {
      if (uploadedKey) await removeKeys(supabase, [uploadedKey]); // cleanup file
      const msg = (error as any)?.message?.toLowerCase() || "";
      if ((error as any)?.code === "23505")
        return NextResponse.json(
          { error: "Notaris already exists for this progress" },
          { status: 409 }
        );
      const isPrereq = msg.includes("prerequisites invalid");
      return NextResponse.json(
        {
          error: isPrereq
            ? "Prerequisites not met"
            : "Failed to create Notaris",
          detail: (error as any)?.message ?? error,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    if (uploadedKey) await removeKeys(supabase, [uploadedKey]);
    return NextResponse.json(
      { error: "Failed to create Notaris", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

// PATCH /api/progress/[id]/notaris
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("update", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  let ulokId: string;
  try {
    ulokId = await resolveUlokIdWithinScope(
      supabase,
      progressId,
      user.branch_id
    );
  } catch (e: any) {
    const msg = e?.message || "Scope check failed";
    const status = /out of scope|not found/i.test(msg) ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  // Ambil row lama untuk cleanup file jika diganti
  const { data: oldRow, error: getErr } = await supabase.rpc("fn_notaris_get", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
  });
  if (getErr) {
    const status = (getErr as any)?.code === "22023" ? 404 : 500;
    return NextResponse.json(
      { error: "Failed to load Notaris", detail: getErr.message ?? getErr },
      { status }
    );
  }
  if (!oldRow)
    return NextResponse.json({ error: "Notaris not found" }, { status: 404 });

  const ct = req.headers.get("content-type") || "";
  let payload: Record<string, unknown> = {};
  let uploadedKey: string | undefined;
  let replaced = false;

  try {
    if (ct.includes("multipart/form-data")) {
      const parsed = await parseMultipartAndUpload(supabase, ulokId, req);
      payload = parsed.payload;
      uploadedKey = parsed.newUploadedKey;
      replaced = parsed.replacedFile || false;
    } else {
      const body = await req.json().catch(() => ({}));
      if (
        "id" in body ||
        "progress_kplt_id" in body ||
        "final_status_notaris" in body ||
        "created_at" in body ||
        "updated_at" in body ||
        "tgl_selesai_notaris" in body
      ) {
        return NextResponse.json(
          { error: "Invalid payload: server-controlled fields present" },
          { status: 400 }
        );
      }
      const parsed = NotarisUpdateSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      payload = stripServerControlledFieldsNotaris(parsed.data);

      const po = (payload as any)?.par_online;
      if (typeof po === "string") {
        if (!po.startsWith(`${ulokId}/notaris/`)) {
          return NextResponse.json(
            { error: "Invalid par_online key prefix" },
            { status: 422 }
          );
        }
        replaced = true;
      }
    }

    const { data, error } = await supabase.rpc("fn_notaris_update", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: progressId,
      p_payload: payload,
    });

    if (error) {
      if (uploadedKey) await removeKeys(supabase, [uploadedKey]);
      const status = (error as any)?.code === "22023" ? 409 : 500;
      return NextResponse.json(
        { error: "Failed to update Notaris", detail: error.message ?? error },
        { status }
      );
    }

    // Hapus file lama jika diganti
    if (replaced) {
      const prev = (oldRow as any)?.par_online;
      const now = (payload as any)?.par_online;
      if (typeof prev === "string" && prev && prev !== now) {
        await removeKeys(supabase, [prev]);
      }
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    if (uploadedKey) await removeKeys(supabase, [uploadedKey]);
    return NextResponse.json(
      { error: "Failed to update Notaris", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

// DELETE /api/progress/[id]/notaris
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("delete", user) && !canKplt("update", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  // Dapatkan row untuk tahu key file
  const { data: oldRow, error: getErr } = await supabase.rpc("fn_notaris_get", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
  });
  if (getErr) {
    const status = (getErr as any)?.code === "22023" ? 404 : 500;
    return NextResponse.json(
      { error: "Failed to load Notaris", detail: getErr.message ?? getErr },
      { status }
    );
  }
  if (!oldRow)
    return NextResponse.json({ error: "Notaris not found" }, { status: 404 });

  const { data, error } = await supabase.rpc("fn_notaris_delete", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
  });

  if (error) {
    const status = (error as any)?.code === "22023" ? 409 : 500;
    return NextResponse.json(
      { error: "Failed to delete Notaris", detail: error.message ?? error },
      { status }
    );
  }

  // Hapus file par_online (best-effort)
  const prev = (oldRow as any)?.par_online;
  if (typeof prev === "string" && prev) await removeKeys(supabase, [prev]);

  return NextResponse.json({ data }, { status: 200 });
}
