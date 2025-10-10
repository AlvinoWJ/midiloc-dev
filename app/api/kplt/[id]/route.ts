import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import { KpltIdParamSchema } from "@/lib/validations/kplt-approval";
import {
  isUuid,
  PDF_FIELDS,
  MIME,
  EXCEL_FIELDS,
  VIDEO_FIELDS,
  IMAGE_FIELDS,
  buildPathByField,
  isDbError,
} from "@/lib/storage/path";
import { KpltCreatePayloadSchema } from "@/lib/validations/kplt";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKET = "file_storage";
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_DOC_SIZE = 20 * 1024 * 1024; // 20MB (selaras dengan POST)

// Gabungkan semua field file agar konsisten dengan POST
const FILE_FIELDS = [
  ...PDF_FIELDS,
  ...EXCEL_FIELDS,
  ...VIDEO_FIELDS,
  ...IMAGE_FIELDS,
] as const;

// Schema update mengikuti tipe POST tapi semua optional
const KpltUpdatePayloadSchema = KpltCreatePayloadSchema.partial();

type SupaClient = Awaited<ReturnType<typeof createClient>>;

interface KpltRow {
  id: string;
  ulok_id: string;
  kplt_approval?: string | null;
  [key: string]: unknown;
}

function ensureSize(file: File, max: number): void {
  if (file.size === 0) {
    throw new Error("Empty file");
  }
  if (file.size > max) {
    throw new Error(
      `File too large (max ${Math.round(max / (1024 * 1024))}MB)`
    );
  }
}

async function uploadFile(
  supabase: SupaClient,
  path: string,
  file: File,
  contentType?: string
): Promise<string> {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: contentType || file.type || undefined,
  });
  if (error) throw new Error(error.message);
  return path;
}

// detail kplt
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
  if (!user.branch_id) {
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
  }

  const parsed = KpltIdParamSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid id", detail: parsed.error.issues },
      { status: 422 }
    );
  }

  const { data, error } = await supabase.rpc("fn_kplt_detail", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_position: String(user.position_nama ?? "").toLowerCase(),
    p_kplt_id: parsed.data.id,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch KPLT detail", detail: error.message ?? error },
      { status: 500 }
    );
  }
  if (!data) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  return NextResponse.json(data, { status: 200 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("update", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = (params?.id || "").trim();
  if (!isUuid(id))
    return NextResponse.json({ error: "Invalid kplt_id" }, { status: 422 });

  // Ambil ulok_id dan path lama (untuk delete jika diganti)
  const { data: existing, error: getErr } = await supabase
    .from("kplt")
    .select(["id", "ulok_id", "kplt_approval", ...FILE_FIELDS].join(","))
    .eq("id", id)
    .single<KpltRow>();

  if (getErr || !existing) {
    return NextResponse.json({ error: "KPLT not found" }, { status: 404 });
  }

  const ulokId = existing.ulok_id;

  const contentTypeHeader = req.headers.get("content-type") || "";
  const isMultipart = contentTypeHeader.startsWith("multipart/form-data");

  const uploadedNew: string[] = [];
  const toDeleteAfterSuccess: string[] = [];

  if (isMultipart) {
    const form = await req.formData().catch(() => null);
    if (!form)
      return NextResponse.json({ error: "Invalid multipart" }, { status: 400 });

    // Payload non-file (DB akan cast numeric/enum dari string)
    const payload: Record<string, unknown> = {};
    for (const [k, v] of form.entries()) {
      if (v instanceof File) continue;
      if (typeof v === "string") payload[k] = v;
    }

    try {
      // Proses tiap file field
      for (const field of FILE_FIELDS) {
        const val = form.get(field);
        if (!(val instanceof File)) continue;

        const file = val;

        // Validasi ukuran & MIME konsisten dengan POST
        if (PDF_FIELDS.includes(field as (typeof PDF_FIELDS)[number])) {
          ensureSize(file, MAX_DOC_SIZE);
          if (file.type && !MIME.pdf.includes(file.type)) {
            return NextResponse.json(
              { error: `Invalid content-type for ${field}` },
              { status: 400 }
            );
          }
        } else if (
          EXCEL_FIELDS.includes(field as (typeof EXCEL_FIELDS)[number])
        ) {
          ensureSize(file, MAX_DOC_SIZE);
          if (file.type && !MIME.excel.includes(file.type)) {
            return NextResponse.json(
              { error: `Invalid content-type for ${field}` },
              { status: 400 }
            );
          }
        } else if (
          VIDEO_FIELDS.includes(field as (typeof VIDEO_FIELDS)[number])
        ) {
          ensureSize(file, MAX_VIDEO_SIZE);
          if (file.type && !MIME.video.includes(file.type)) {
            return NextResponse.json(
              { error: `Invalid content-type for ${field}` },
              { status: 400 }
            );
          }
        } else if (
          IMAGE_FIELDS.includes(field as (typeof IMAGE_FIELDS)[number])
        ) {
          ensureSize(file, MAX_DOC_SIZE);
          if (file.type && !MIME.image.includes(file.type)) {
            return NextResponse.json(
              { error: `Invalid content-type for ${field}` },
              { status: 400 }
            );
          }
        }

        // Path seragam dengan POST
        const path = buildPathByField(
          ulokId,
          "kplt",
          field,
          file.name,
          file.type
        );

        const contentType = PDF_FIELDS.includes(
          field as (typeof PDF_FIELDS)[number]
        )
          ? "application/pdf"
          : EXCEL_FIELDS.includes(field as (typeof EXCEL_FIELDS)[number])
          ? file.type ||
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : IMAGE_FIELDS.includes(field as (typeof IMAGE_FIELDS)[number])
          ? file.type || "image/png"
          : file.type || "video/mp4";

        const uploadedPath = await uploadFile(
          supabase,
          path,
          file,
          contentType
        );
        uploadedNew.push(uploadedPath);
        payload[field] = uploadedPath;

        const oldPath = existing[field] as string | undefined;
        if (
          typeof oldPath === "string" &&
          oldPath &&
          oldPath !== uploadedPath
        ) {
          toDeleteAfterSuccess.push(oldPath);
        }
      }
    } catch (e) {
      // Rollback semua yang sudah ter-upload jika salah satu upload gagal
      if (uploadedNew.length > 0) {
        await supabase.storage
          .from(BUCKET)
          .remove(uploadedNew)
          .catch(() => undefined);
      }
      const message = e instanceof Error ? e.message : "Upload failed";
      return NextResponse.json(
        { error: "Upload failed", detail: message },
        { status: 500 }
      );
    }

    // Validasi payload non-file dengan schema partial
    const parsed = KpltUpdatePayloadSchema.safeParse(payload);
    if (!parsed.success) {
      if (uploadedNew.length > 0) {
        await supabase.storage
          .from(BUCKET)
          .remove(uploadedNew)
          .catch(() => undefined);
      }
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    // Update via RPC
    const { data, error } = await supabase.rpc("fn_kplt_update", {
      p_user_id: user.id,
      p_kplt_id: id,
      p_payload: parsed.data,
    });

    if (error) {
      if (uploadedNew.length > 0) {
        await supabase.storage
          .from(BUCKET)
          .remove(uploadedNew)
          .catch(() => undefined);
      }
      const code = isDbError(error) ? error.code : undefined;
      const detail = isDbError(error)
        ? error.message || error.hint || "Unknown error"
        : "Unknown error";
      if (code === "22023")
        return NextResponse.json(
          { error: "Bad Request", message: detail },
          { status: 400 }
        );
      if (code === "23505")
        return NextResponse.json(
          { error: "Conflict", message: detail },
          { status: 409 }
        );
      if (code === "42501")
        return NextResponse.json(
          { error: "Forbidden", message: detail },
          { status: 403 }
        );
      return NextResponse.json(
        { error: "RPC Error", code, message: detail },
        { status: 500 }
      );
    }

    // Hapus file lama yang tergantikan (best-effort)
    if (toDeleteAfterSuccess.length > 0) {
      await supabase.storage
        .from(BUCKET)
        .remove(toDeleteAfterSuccess)
        .catch(() => undefined);
    }

    return NextResponse.json(data, { status: 200 });
  }

  // JSON mode: hanya izinkan field non-file (file wajib via multipart)
  if (!contentTypeHeader.startsWith("application/json")) {
    return NextResponse.json(
      {
        error:
          "Use multipart/form-data for file updates or application/json for non-file updates",
      },
      { status: 400 }
    );
  }

  const bodyUnknown = await req.json().catch(() => null);
  if (!bodyUnknown || typeof bodyUnknown !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const body = bodyUnknown as Record<string, unknown>;

  // Tolak jika ada field file di JSON
  const hasFileField = FILE_FIELDS.some((k) =>
    Object.prototype.hasOwnProperty.call(body, k)
  );
  if (hasFileField) {
    return NextResponse.json(
      { error: "File fields must be updated via multipart/form-data" },
      { status: 400 }
    );
  }

  const parsed = KpltUpdatePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", detail: parsed.error.issues },
      { status: 422 }
    );
  }

  const { data, error } = await supabase.rpc("fn_kplt_update", {
    p_user_id: user.id,
    p_kplt_id: id,
    p_payload: parsed.data,
  });

  if (error) {
    const code = isDbError(error) ? error.code : undefined;
    const detail = isDbError(error)
      ? error.message || error.hint || "Unknown error"
      : "Unknown error";
    if (code === "22023")
      return NextResponse.json(
        { error: "Bad Request", message: detail },
        { status: 400 }
      );
    if (code === "23505")
      return NextResponse.json(
        { error: "Conflict", message: detail },
        { status: 409 }
      );
    if (code === "42501")
      return NextResponse.json(
        { error: "Forbidden", message: detail },
        { status: 403 }
      );
    return NextResponse.json(
      { error: "RPC Error", code, message: detail },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("delete", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = (params?.id || "").trim();
  if (!isUuid(id))
    return NextResponse.json({ error: "Invalid kplt_id" }, { status: 422 });

  const { data: existing, error: getErr } = await supabase
    .from("kplt")
    .select(["id", "kplt_approval", ...FILE_FIELDS].join(","))
    .eq("id", id)
    .single<KpltRow>();

  if (getErr || !existing) {
    return NextResponse.json({ error: "KPLT not found" }, { status: 404 });
  }

  // Opsional: cegah delete jika status bukan 'In Progress'
  if (existing.kplt_approval && existing.kplt_approval !== "In Progress") {
    return NextResponse.json(
      {
        error: "Conflict",
        message: "KPLT cannot be deleted in the current status",
      },
      { status: 409 }
    );
  }

  // Hapus row
  const { error: delErr } = await supabase.from("kplt").delete().eq("id", id);
  if (delErr) {
    return NextResponse.json(
      { error: "Delete failed", detail: delErr.message },
      { status: 500 }
    );
  }

  // Hapus file-file terkait (best-effort)
  const pathsToRemove: string[] = [];
  for (const field of FILE_FIELDS) {
    const val = existing[field] as unknown;
    if (typeof val === "string" && val.length > 0) {
      pathsToRemove.push(val);
    }
  }
  if (pathsToRemove.length > 0) {
    await supabase.storage
      .from(BUCKET)
      .remove(pathsToRemove)
      .catch(() => undefined);
  }

  return NextResponse.json(
    { deleted: { id }, removed_files_count: pathsToRemove.length },
    { status: 200 }
  );
}
