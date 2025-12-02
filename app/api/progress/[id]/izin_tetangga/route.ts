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
import { validateProgressAccess } from "@/utils/kpltProgressBranchChecker";

export const dynamic = "force-dynamic";

const BUCKET = "file_storage";
const FILE_FIELDS = ["file_izin_tetangga", "file_bukti_pembayaran"] as const;
type FileField = (typeof FILE_FIELDS)[number];

// =============================================================================
// HELPERS
// =============================================================================

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
  if (error) throw new Error(`Upload failed for ${field}`);
  return key;
}

async function removeKeys(supabase: any, keys: string[]) {
  if (!keys.length) return;
  await supabase.storage.from(BUCKET).remove(keys);
}

/**
 * Helper untuk parsing Multipart Form Data secara dinamis.
 * Menangani file upload & text fields sekaligus.
 */
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

  // 1. Process Files
  for (const field of FILE_FIELDS) {
    const entry = form.get(field);

    if (entry instanceof File && entry.size > 0) {
      // Logic Upload File Baru
      const key = await uploadOne(supabase, ulokId, field, entry);
      payload[field] = key;
      newUploadedKeys.push(key);
      replacedFields.push(field);
    } else if (typeof entry === "string" && entry.trim() !== "") {
      // Logic Retain File Lama (kirim key string)
      const key = entry.trim();
      if (!isValidPrefixKey(ulokId, moduleName, key)) {
        throw new Error(`Invalid key prefix for ${field}`);
      }
      payload[field] = key;
      replacedFields.push(field);
    }
  }

  // 2. Process Text Fields
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

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

/**
 * @route GET /api/progress/[id]/izin_tetangga
 * @description Mengambil detail data Izin Tetangga.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    // Auth Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canProgressKplt("read", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!user.branch_id)
      return NextResponse.json(
        { error: "Forbidden: No branch" },
        { status: 403 }
      );

    // Validate Access
    const check = await validateProgressAccess(supabase, user, params.id);
    if (!check.allowed)
      return NextResponse.json(
        { error: check.error },
        { status: check.status }
      );

    // Fetch Data
    const { data, error } = await supabase.rpc("fn_it_get", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: params.id,
    });

    if (error) {
      console.error("[IT_GET_RPC]", error);
      return NextResponse.json(
        { error: "Failed to fetch data" },
        { status: 500 }
      );
    }
    if (!data)
      return NextResponse.json({ error: "Data not found" }, { status: 404 });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[IT_GET_UNHANDLED]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @route POST /api/progress/[id]/izin_tetangga
 * @description Membuat data Izin Tetangga baru (Multipart/JSON).
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  let uploadedKeys: string[] = [];

  try {
    const user = await getCurrentUser();

    // Auth Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canProgressKplt("create", user) && !canProgressKplt("update", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!user.branch_id)
      return NextResponse.json(
        { error: "Forbidden: No branch" },
        { status: 403 }
      );

    // Validate Access
    const check = await validateProgressAccess(supabase, user, params.id);
    if (!check.allowed)
      return NextResponse.json(
        { error: check.error },
        { status: check.status }
      );

    // Resolve Context
    const ulokId = await resolveUlokIdWithinScope(
      supabase,
      params.id,
      user.branch_id
    );

    // Parse Body
    let payload: Record<string, unknown> = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const parsed = await parseMultipartAndUpload(supabase, ulokId, req);
      payload = parsed.payload;
      uploadedKeys = parsed.newUploadedKeys;
    } else {
      const body = await req.json().catch(() => ({}));
      const parsed = ITCreateSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      payload = stripServerControlledFieldsIT(parsed.data);
    }

    // Execute RPC
    const { data, error } = await supabase.rpc("fn_it_create", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: params.id,
      p_payload: payload,
    });

    if (error) {
      await removeKeys(supabase, uploadedKeys); // Rollback
      const code = (error as any)?.code;
      if (code === "23505")
        return NextResponse.json(
          { error: "Conflict: Data already exists" },
          { status: 409 }
        );

      console.error("[IT_CREATE_RPC]", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    await removeKeys(supabase, uploadedKeys); // Rollback
    console.error("[IT_POST_UNHANDLED]", err);
    return NextResponse.json(
      { error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @route PATCH /api/progress/[id]/izin_tetangga
 * @description Mengupdate data Izin Tetangga (Multipart/JSON).
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  let uploadedKeys: string[] = [];

  try {
    const user = await getCurrentUser();

    // Auth Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canProgressKplt("update", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!user.branch_id)
      return NextResponse.json(
        { error: "Forbidden: No branch" },
        { status: 403 }
      );

    // Validate Access
    const check = await validateProgressAccess(supabase, user, params.id);
    if (!check.allowed)
      return NextResponse.json(
        { error: check.error },
        { status: check.status }
      );

    // Resolve Context & Old Data
    const ulokId = await resolveUlokIdWithinScope(
      supabase,
      params.id,
      user.branch_id
    );
    const { data: oldRow, error: getErr } = await supabase.rpc("fn_it_get", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: params.id,
    });

    if (getErr || !oldRow)
      return NextResponse.json({ error: "Data not found" }, { status: 404 });

    // Parse Body
    let payload: Record<string, unknown> = {};
    let replacedFields: FileField[] = [];
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const parsed = await parseMultipartAndUpload(supabase, ulokId, req);
      payload = parsed.payload;
      uploadedKeys = parsed.newUploadedKeys;
      replacedFields = parsed.replacedFields;
    } else {
      const body = await req.json().catch(() => ({}));
      const parsed = ITUpdateSchema.safeParse(body);
      if (!parsed.success)
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      payload = stripServerControlledFieldsIT(parsed.data);
      // Deteksi field file mana yang diupdate via JSON (jika ada)
      for (const f of FILE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(payload, f))
          replacedFields.push(f);
      }
    }

    // Execute RPC
    const { data, error } = await supabase.rpc("fn_it_update", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: params.id,
      p_payload: payload,
    });

    if (error) {
      await removeKeys(supabase, uploadedKeys); // Rollback upload baru
      console.error("[IT_UPDATE_RPC]", error);
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }

    // Cleanup Old Files (Jika sukses update)
    const oldKeysToDelete: string[] = [];
    for (const f of replacedFields) {
      const prev = (oldRow as any)?.[f];
      const now = (payload as any)?.[f];
      if (typeof prev === "string" && prev && prev !== now) {
        oldKeysToDelete.push(prev);
      }
    }
    await removeKeys(supabase, oldKeysToDelete);

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    await removeKeys(supabase, uploadedKeys); // Rollback upload baru
    console.error("[IT_PATCH_UNHANDLED]", err);
    return NextResponse.json(
      { error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @route DELETE /api/progress/[id]/izin_tetangga
 * @description Menghapus data Izin Tetangga dan file terkait.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    // Auth Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canProgressKplt("delete", user) && !canProgressKplt("update", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!user.branch_id)
      return NextResponse.json(
        { error: "Forbidden: No branch" },
        { status: 403 }
      );

    // Validate Access
    const check = await validateProgressAccess(supabase, user, params.id);
    if (!check.allowed)
      return NextResponse.json(
        { error: check.error },
        { status: check.status }
      );

    // Get Old Data (for cleanup)
    const { data: oldRow, error: getErr } = await supabase.rpc("fn_it_get", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: params.id,
    });

    if (getErr || !oldRow)
      return NextResponse.json({ error: "Data not found" }, { status: 404 });

    // Execute Delete RPC
    const { data, error } = await supabase.rpc("fn_it_delete", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: params.id,
    });

    if (error) {
      console.error("[IT_DELETE_RPC]", error);
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    // Cleanup Files
    const keysToDelete: string[] = [];
    for (const f of FILE_FIELDS) {
      const k = (oldRow as any)?.[f];
      if (typeof k === "string" && k) keysToDelete.push(k);
    }
    await removeKeys(supabase, keysToDelete);

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[IT_DELETE_UNHANDLED]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
