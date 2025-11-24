/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canProgressKplt } from "@/lib/auth/acl";
import {
  ITCreateSchema,
  ITUpdateSchema,
  stripServerControlledFieldsIT,
} from "@/lib/validations/izin_tetangga";
import { makeFieldKey, isValidPrefixKey } from "@/lib/storage/naming";

const BUCKET = "file_storage";
const FILE_FIELDS = ["file_izin_tetangga", "file_bukti_pembayaran"] as const;
type FileField = (typeof FILE_FIELDS)[number];

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

async function uploadOne(
  supabase: any,
  ulokId: string,
  field: FileField,
  f: File
) {
  const key = makeFieldKey(ulokId, "izin_tetangga", field, f);
  const { error } = await supabase.storage.from(BUCKET).upload(key, f, {
    upsert: false,
    contentType: f.type || "application/octet-stream",
    cacheControl: "3600",
  });
  if (error) throw new Error(`Upload failed ${field}: ${error.message}`);
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
) {
  const form = await req.formData();
  const payload: Record<string, unknown> = {};
  const newUploadedKeys: string[] = [];
  const replacedFields: FileField[] = [];
  const moduleName = "izin_tetangga";

  for (const field of FILE_FIELDS) {
    const v = form.get(field);
    if (v instanceof File && v.size > 0) {
      const key = await uploadOne(supabase, ulokId, field, v);
      payload[field] = key;
      newUploadedKeys.push(key);
      replacedFields.push(field);
    } else if (typeof v === "string" && v.trim() !== "") {
      const key = v.trim();
      if (!isValidPrefixKey(ulokId, moduleName, key)) {
        throw new Error(`Invalid key prefix for ${field}`);
      }
      payload[field] = key;
      replacedFields.push(field);
    }
  }

  for (const [k, v] of form.entries()) {
    if ((FILE_FIELDS as readonly string[]).includes(k)) continue;
    if (typeof v === "string" && v.trim() !== "") payload[k] = v.trim();
  }

  return { payload, newUploadedKeys, replacedFields } as {
    payload: Record<string, unknown>;
    newUploadedKeys: string[];
    replacedFields: FileField[];
  };
}
// GET /api/progress/[id]/izin-tetangga
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canProgressKplt("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  const { data, error } = await supabase.rpc("fn_it_get", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
  });

  if (error) {
    const status = (error as any)?.code === "22023" ? 404 : 500;
    return NextResponse.json(
      { error: "Failed to load IT", detail: error.message ?? error },
      { status }
    );
  }
  if (!data)
    return NextResponse.json(
      { error: "Izin Tetangga not found" },
      { status: 404 }
    );
  return NextResponse.json({ data }, { status: 200 });
}

// POST /api/progress/[id]/izin-tetangga
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canProgressKplt("create", user) && !canProgressKplt("update", user))
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
  let uploadedKeys: string[] = [];

  try {
    if (ct.includes("multipart/form-data")) {
      const parsed = await parseMultipartAndUpload(supabase, ulokId, req);
      payload = parsed.payload;
      uploadedKeys = parsed.newUploadedKeys;
    } else {
      const body = await req.json().catch(() => ({}));
      if (
        "id" in body ||
        "progress_kplt_id" in body ||
        "final_status_it" in body ||
        "created_at" in body ||
        "updated_at" in body ||
        "tgl_selesai_izintetangga" in body
      ) {
        return NextResponse.json(
          { error: "Invalid payload: server-controlled fields present" },
          { status: 400 }
        );
      }
      const parsed = ITCreateSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      payload = stripServerControlledFieldsIT(parsed.data);
    }

    const { data, error } = await supabase.rpc("fn_it_create", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: progressId,
      p_payload: payload,
    });

    if (error) {
      await removeKeys(supabase, uploadedKeys);
      const code = (error as any)?.code ?? "";
      if (code === "23505")
        return NextResponse.json(
          { error: "Izin Tetangga already exists for this progress" },
          { status: 409 }
        );
      return NextResponse.json(
        {
          error: "Failed to create Izin Tetangga",
          detail: error.message ?? error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    await removeKeys(supabase, uploadedKeys);
    return NextResponse.json(
      {
        error: "Failed to create Izin Tetangga",
        detail: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}

// PATCH /api/progress/[id]/izin-tetangga
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canProgressKplt("update", user))
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

  // Ambil row lama (untuk cleanup file lama)
  const { data: oldRow, error: getErr } = await supabase.rpc("fn_it_get", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
  });
  if (getErr) {
    const status = (getErr as any)?.code === "22023" ? 404 : 500;
    return NextResponse.json(
      { error: "Failed to load IT", detail: getErr.message ?? getErr },
      { status }
    );
  }
  if (!oldRow)
    return NextResponse.json(
      { error: "Izin Tetangga not found" },
      { status: 404 }
    );

  const ct = req.headers.get("content-type") || "";
  let payload: Record<string, unknown> = {};
  let uploadedKeys: string[] = [];
  let replacedFields: FileField[] = [];

  try {
    if (ct.includes("multipart/form-data")) {
      const parsed = await parseMultipartAndUpload(supabase, ulokId, req);
      payload = parsed.payload;
      uploadedKeys = parsed.newUploadedKeys;
      replacedFields = parsed.replacedFields;
    } else {
      const body = await req.json().catch(() => ({}));
      if (
        "id" in body ||
        "progress_kplt_id" in body ||
        "final_status_it" in body ||
        "created_at" in body ||
        "updated_at" in body ||
        "tgl_selesai_izintetangga" in body
      ) {
        return NextResponse.json(
          { error: "Invalid payload: server-controlled fields present" },
          { status: 400 }
        );
      }
      const parsed = ITUpdateSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      payload = stripServerControlledFieldsIT(parsed.data);
      for (const f of FILE_FIELDS)
        if (Object.prototype.hasOwnProperty.call(payload, f))
          replacedFields.push(f);
    }

    const { data, error } = await supabase.rpc("fn_it_update", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: progressId,
      p_payload: payload,
    });

    if (error) {
      await removeKeys(supabase, uploadedKeys);
      const status = (error as any)?.code === "22023" ? 409 : 500;
      return NextResponse.json(
        {
          error: "Failed to update Izin Tetangga",
          detail: error.message ?? error,
        },
        { status }
      );
    }

    // Hapus file lama yang tergantikan
    const oldKeysToDelete: string[] = [];
    for (const f of replacedFields) {
      const prev = (oldRow as any)?.[f];
      const now = (payload as any)?.[f];
      if (typeof prev === "string" && prev && prev !== now)
        oldKeysToDelete.push(prev);
    }
    await removeKeys(supabase, oldKeysToDelete);

    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    await removeKeys(supabase, uploadedKeys);
    return NextResponse.json(
      {
        error: "Failed to update Izin Tetangga",
        detail: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}

// DELETE /api/progress/[id]/izin-tetangga
// - Hapus row via RPC; jika sukses, hapus file di Storage (best-effort)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canProgressKplt("delete", user) && !canProgressKplt("update", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  // Ambil row lama untuk tahu key file
  const { data: oldRow, error: getErr } = await supabase.rpc("fn_it_get", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
  });
  if (getErr) {
    const status = (getErr as any)?.code === "22023" ? 404 : 500;
    return NextResponse.json(
      { error: "Failed to load IT", detail: getErr.message ?? getErr },
      { status }
    );
  }
  if (!oldRow)
    return NextResponse.json(
      { error: "Izin Tetangga not found" },
      { status: 404 }
    );

  const { data, error } = await supabase.rpc("fn_it_delete", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
  });

  if (error) {
    const status = (error as any)?.code === "22023" ? 409 : 500;
    return NextResponse.json(
      {
        error: "Failed to delete Izin Tetangga",
        detail: error.message ?? error,
      },
      { status }
    );
  }

  // Cleanup Storage (best-effort)
  const keys: string[] = [];
  for (const f of FILE_FIELDS) {
    const k = (oldRow as any)?.[f];
    if (typeof k === "string" && k) keys.push(k);
  }
  await removeKeys(supabase, keys);

  return NextResponse.json({ data }, { status: 200 });
}
