/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import {
  PerizinanCreateSchema,
  PerizinanUpdateSchema,
  stripServerControlledFieldsPerizinan,
} from "@/lib/validations/perizinan";
import { makeFieldKey, isValidPrefixKey } from "@/lib/storage/naming";

// Konstanta bucket
const BUCKET = "file_storage";

// Daftar kolom file_* di tabel perizinan
const FILE_FIELDS = [
  "file_sph",
  "file_bukti_st",
  "file_denah",
  "file_spk",
  "file_rekom_notaris",
] as const;
type FileField = (typeof FILE_FIELDS)[number];

// Helper: ambil ulok_id dari progress_kplt (cek scope branch)
async function fetchUlokIdWithinScope(
  supabase: any,
  progressId: string,
  branchId: string
): Promise<string> {
  const { data, error } = await supabase
    .from("progress_kplt")
    .select(
      `
      id,
      kplt:kplt!progress_kplt_kplt_id_fkey!inner (
        id,
        branch_id,
        ulok_id
      )
    `
    )
    .eq("id", progressId)
    .eq("kplt.branch_id", branchId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "Failed to verify progress scope");
  }
  if (!data || !data.kplt) {
    throw new Error("Progress not found or out of scope");
  }
  const ulokId = (data.kplt as any).ulok_id as string | null;
  if (!ulokId) {
    throw new Error("ulok_id is missing for this progress");
  }
  return ulokId;
}

// Upload satu file ke Storage dan kembalikan key
async function uploadOneFile(
  supabase: any,
  ulokId: string,
  moduleName: string,
  field: FileField,
  file: File
): Promise<string> {
  const key = makeFieldKey(ulokId, moduleName, field, file);
  const contentType = file.type || "application/octet-stream";
  const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
    upsert: false,
    contentType,
    cacheControl: "3600",
  });
  if (error) throw new Error(`Failed to upload ${field}: ${error.message}`);
  return key;
}

// Hapus beberapa file dari Storage (best-effort)
async function removeFiles(supabase: any, keys: string[]) {
  if (!keys.length) return;
  await supabase.storage.from(BUCKET).remove(keys);
}

// Ekstrak multipart: upload file_* lalu bentuk payload JSON untuk RPC
async function parseMultipartAndUpload(
  supabase: any,
  ulokId: string,
  req: Request
): Promise<{
  payload: Record<string, unknown>;
  newUploadedKeys: string[];
  replacedFileFields: FileField[];
}> {
  const form = await req.formData();
  const payload: Record<string, unknown> = {};
  const newUploadedKeys: string[] = [];
  const replacedFileFields: FileField[] = [];
  const moduleName = "perizinan";

  for (const field of FILE_FIELDS) {
    const value = form.get(field);
    if (value instanceof File && value.size > 0) {
      const key = await uploadOneFile(supabase, ulokId, moduleName, field, value);
      payload[field] = key;
      newUploadedKeys.push(key);
      replacedFileFields.push(field);
    } else if (typeof value === "string" && value.trim() !== "") {
      const key = value.trim();
      if (!isValidPrefixKey(ulokId, moduleName, key)) {
        throw new Error(`Invalid key prefix for ${field}`);
      }
      payload[field] = key;
      replacedFileFields.push(field);
    }
  }

  for (const [k, v] of form.entries()) {
    if ((FILE_FIELDS as readonly string[]).includes(k)) continue;
    if (typeof v === "string" && v.trim() !== "") payload[k] = v.trim();
  }

  return { payload, newUploadedKeys, replacedFileFields };
}

// GET /api/progress/[id]/perizinan
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

  const { data, error } = await supabase.rpc("fn_perizinan_get", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
  });

  if (error) {
    const status = (error as any)?.code === "22023" ? 404 : 500;
    return NextResponse.json(
      { error: "Failed to load perizinan", detail: error.message ?? error },
      { status }
    );
  }
  if (!data)
    return NextResponse.json({ error: "Perizinan not found" }, { status: 404 });
  return NextResponse.json({ data }, { status: 200 });
}

// POST /api/progress/[id]/perizinan
// - Terima multipart/form-data (file_* + field lain) ATAU JSON tanpa file.
// - Jika multipart: server upload file_* ke Storage (folder diawali ulok_id), lalu kirim key ke RPC create.
// - Atomic di DB dijamin oleh RPC; Storage upload tidak bisa satu transaksi, jadi jika RPC gagal -> hapus kembali file yang sudah terupload.
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

  // Ambil ulok_id (sekalian cek scope branch)
  let ulokId: string;
  try {
    ulokId = await fetchUlokIdWithinScope(supabase, progressId, user.branch_id);
  } catch (e: any) {
    const msg = e?.message || "Scope check failed";
    const status =
      msg.toLowerCase().includes("out of scope") ||
      msg.toLowerCase().includes("not found")
        ? 404
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  const contentType = req.headers.get("content-type") || "";
  let payload: Record<string, unknown> = {};
  let uploadedKeys: string[] = [];

  try {
    if (contentType.includes("multipart/form-data")) {
      const parsed = await parseMultipartAndUpload(supabase, ulokId, req);
      payload = parsed.payload;
      uploadedKeys = parsed.newUploadedKeys;
    } else {
      // Fallback JSON
      const body = await req.json().catch(() => ({}));
      if (
        "id" in body ||
        "progress_kplt_id" in body ||
        "final_status_perizinan" in body ||
        "created_at" in body ||
        "updated_at" in body ||
        "tgl_selesai_perizinan" in body
      ) {
        return NextResponse.json(
          { error: "Invalid payload: server-controlled fields present" },
          { status: 400 }
        );
      }
      const parsed = PerizinanCreateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      }
      payload = stripServerControlledFieldsPerizinan(parsed.data);
    }

    // Panggil RPC create
    const { data, error } = await supabase.rpc("fn_perizinan_create", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: progressId,
      p_payload: payload,
    });

    if (error) {
      // Rollback file upload baru (best-effort)
      await removeFiles(supabase, uploadedKeys);
      const code = (error as any)?.code ?? "";
      if (code === "23505")
        return NextResponse.json(
          { error: "Perizinan already exists for this progress" },
          { status: 409 }
        );
      const precond =
        (error as any)?.message
          ?.toLowerCase()
          .includes("mou must be selesai") ||
        (error as any)?.message?.toLowerCase().includes("mou is not finalized");
      return NextResponse.json(
        {
          error: precond
            ? "MOU must be Selesai before creating perizinan"
            : "Failed to create perizinan",
          detail: error.message ?? error,
        },
        { status: precond ? 422 : 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (e: any) {
    // Cleanup file jika error lain sebelum RPC success
    await removeFiles(supabase, uploadedKeys);
    return NextResponse.json(
      { error: "Failed to create perizinan", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

// PATCH /api/progress/[id]/perizinan
// - Terima multipart/form-data atau JSON.
// - Jika multipart: upload file_* baru ke folder diawali ulok_id, lalu update via RPC.
// - Jika update sukses dan ada penggantian file_*, hapus file lama (best-effort).
// - Jika update gagal, hapus file yang baru diupload (cleanup).
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

  // Ambil ulok_id (sekalian cek scope branch) untuk path upload
  let ulokId: string;
  try {
    ulokId = await fetchUlokIdWithinScope(supabase, progressId, user.branch_id);
  } catch (e: any) {
    const msg = e?.message || "Scope check failed";
    const status =
      msg.toLowerCase().includes("out of scope") ||
      msg.toLowerCase().includes("not found")
        ? 404
        : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  // Ambil row lama untuk mengetahui key file_* existing (scope diverifikasi oleh RPC get)
  const { data: oldRow, error: getErr } = await supabase.rpc(
    "fn_perizinan_get",
    {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: progressId,
    }
  );
  if (getErr) {
    const status = (getErr as any)?.code === "22023" ? 404 : 500;
    return NextResponse.json(
      { error: "Failed to load perizinan", detail: getErr.message ?? getErr },
      { status }
    );
  }
  if (!oldRow) {
    return NextResponse.json({ error: "Perizinan not found" }, { status: 404 });
  }

  const contentType = req.headers.get("content-type") || "";
  let payload: Record<string, unknown> = {};
  let uploadedKeys: string[] = [];
  let replacedFields: FileField[] = [];

  try {
    if (contentType.includes("multipart/form-data")) {
      const parsed = await parseMultipartAndUpload(supabase, ulokId, req);
      payload = parsed.payload;
      uploadedKeys = parsed.newUploadedKeys;
      replacedFields = parsed.replacedFileFields;
    } else {
      const body = await req.json().catch(() => ({}));
      if (
        "id" in body ||
        "progress_kplt_id" in body ||
        "final_status_perizinan" in body ||
        "created_at" in body ||
        "updated_at" in body ||
        "tgl_selesai_perizinan" in body
      ) {
        return NextResponse.json(
          { error: "Invalid payload: server-controlled fields present" },
          { status: 400 }
        );
      }
      const parsed = PerizinanUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation failed", detail: parsed.error.issues },
          { status: 422 }
        );
      }
      payload = stripServerControlledFieldsPerizinan(parsed.data);
      // Jika JSON update menyertakan file_* berupa key string, anggap sebagai replacedFields
      for (const f of FILE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(payload, f)) {
          replacedFields.push(f);
        }
      }
    }

    // Update via RPC
    const { data, error } = await supabase.rpc("fn_perizinan_update", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: progressId,
      p_payload: payload,
    });

    if (error) {
      // Rollback file baru jika update gagal
      await removeFiles(supabase, uploadedKeys);
      const status = (error as any)?.code === "22023" ? 409 : 500;
      return NextResponse.json(
        { error: "Failed to update perizinan", detail: error.message ?? error },
        { status }
      );
    }

    // Hapus file lama yang digantikan (best-effort)
    const oldKeysToDelete: string[] = [];
    for (const field of replacedFields) {
      const prevKey = (oldRow as any)?.[field];
      if (typeof prevKey === "string" && prevKey.length > 0) {
        // Jika payload menetapkan key sama, jangan hapus
        const newKey = (payload as any)[field];
        if (newKey !== prevKey) {
          oldKeysToDelete.push(prevKey);
        }
      }
    }
    await removeFiles(supabase, oldKeysToDelete);

    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    // Cleanup file yang baru diupload jika error tak terduga
    await removeFiles(supabase, uploadedKeys);
    return NextResponse.json(
      { error: "Failed to update perizinan", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

// DELETE tetap fokus DB; Storage cleanup opsional (belum diaktifkan di sini).
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

  const { data, error } = await supabase.rpc("fn_perizinan_delete", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
  });

  if (error) {
    const status = (error as any)?.code === "22023" ? 409 : 500;
    return NextResponse.json(
      { error: "Failed to delete perizinan", detail: error.message ?? error },
      { status }
    );
  }

  return NextResponse.json({ data }, { status: 200 });
}
