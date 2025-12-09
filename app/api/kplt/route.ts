import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import { KpltCreateMultipartSchema } from "@/lib/validations/kplt";
import {
  buildPathByField,
  EXCEL_FIELDS,
  IMAGE_FIELDS,
  isDbError,
  isUuid,
  MIME,
  PDF_FIELDS,
  VIDEO_FIELDS,
} from "@/lib/storage/path";
import {
  isPdfFile,
  isExcelFile,
  isVideoFile,
  isImageFile,
} from "@/utils/fileChecker";

// =============================================================================
// KONFIGURASI & KONSTANTA
// =============================================================================
export const dynamic = "force-dynamic"; // Pastikan tidak di-cache statis

const STORAGE_BUCKET = "file_storage";
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_DOC_SIZE = 20 * 1024 * 1024; // 20MB

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function decodeCursor(encoded?: string | null) {
  if (!encoded) return null;
  try {
    const base = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base.padEnd(base.length + ((4 - (base.length % 4)) % 4), "=");
    const raw = Buffer.from(pad, "base64").toString("utf8");
    const obj = JSON.parse(raw);
    if (obj.created_at && obj.id) {
      return { created_at: obj.created_at, id: obj.id };
    }
  } catch {}
  return null;
}

function encodeCursor(
  created_at?: string | null,
  id?: string | null
): string | null {
  if (!created_at || !id) return null;
  const json = JSON.stringify({ created_at, id });
  return Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * Helper untuk mengupload file ke Supabase Storage.
 */
async function uploadFileToStorage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  path: string,
  file: File,
  contentType: string
) {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType,
    });
  if (error) throw new Error(`Upload failed for ${path}: ${error.message}`);
  return path;
}

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

/**
 * @route GET /api/kplt
 * @description Mengambil data dashboard KPLT dengan cursor-based pagination.
 * @param {string} scope - 'recent' | 'history' | 'all'
 * @param {string} search - Keyword pencarian kplt
 * @param {string} after - Cursor untuk halaman selanjutnya
 * @param {string} before - Cursor untuk halaman sebelumnya
 * @param {number} year - filter tahun
 * @param {number} month - filter bulan
 * @param {number} limit - batas get data
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canKplt("read", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 2. Parse Query Params
    const url = new URL(req.url);
    const scope = (url.searchParams.get("scope") || "recent").toLowerCase();
    const search = (
      url.searchParams.get("search") ||
      url.searchParams.get("q") ||
      ""
    ).trim();

    // Validasi Month/Year
    const monthRaw =
      url.searchParams.get("month") ?? url.searchParams.get("bulan");
    const yearRaw =
      url.searchParams.get("year") ?? url.searchParams.get("tahun");
    const month = monthRaw ? Number(monthRaw) : undefined;
    const year = yearRaw ? Number(yearRaw) : undefined;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validMonth = (v: any) => Number.isInteger(v) && v >= 1 && v <= 12;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validYear = (v: any) => Number.isInteger(v) && v >= 1970 && v <= 2100;

    if ((monthRaw && !validMonth(month)) || (yearRaw && !validYear(year))) {
      return NextResponse.json(
        { success: false, error: "Bad Request", message: "Invalid month/year" },
        { status: 422 }
      );
    }

    // Limit & Cursors
    const limitRaw = Number(url.searchParams.get("limit") ?? "90");
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 300) : 90;

    const afterDecoded = decodeCursor(url.searchParams.get("after"));
    const beforeDecoded = decodeCursor(url.searchParams.get("before"));

    // 3. Call RPC Dashboard
    const { data, error } = await supabase.rpc("fn_kplt_dashboard", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_position: (user.position_nama || "").toLowerCase(),
      p_scope: scope,
      p_search: search || null,
      p_limit: limit,
      p_after_created_at: afterDecoded?.created_at ?? null,
      p_after_id: afterDecoded?.id ?? null,
      p_before_created_at: beforeDecoded?.created_at ?? null,
      p_before_id: beforeDecoded?.id ?? null,
      p_month: month ?? null,
      p_year: year ?? null,
    });

    if (error) {
      console.error("[API_KPLT_GET] RPC Error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch data" },
        { status: 500 }
      );
    }

    // 4. Format Response (Mempertahankan struktur pagination kompleks)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d: any = data || {};
    const pag = d.pagination || {};
    const pagination: Record<string, unknown> = {};

    if (scope === "recent" && pag.recent) {
      const r = pag.recent;
      pagination.recent = {
        limit: r.limit,
        count_needinput: r.count_needinput,
        count_inprogress: r.count_inprogress,
        count_waitingforum: r.count_waitingforum,
        total: r.total,
        hasNextPage: r.hasNextPage,
        hasPrevPage: r.hasPrevPage,
        startCursor: encodeCursor(r.start_created_at, r.start_id),
        endCursor: encodeCursor(r.end_created_at, r.end_id),
      };
    } else if (scope === "history" && pag.oknok) {
      const h = pag.oknok;
      pagination.oknok = {
        limit: h.limit,
        count_ok: h.count_ok,
        count_nok: h.count_nok,
        total: h.total,
        hasNextPage: h.hasNextPage,
        hasPrevPage: h.hasPrevPage,
        startCursor: encodeCursor(h.start_created_at, h.start_id),
        endCursor: encodeCursor(h.end_created_at, h.end_id),
      };
    }

    return NextResponse.json(
      {
        success: d.success ?? true,
        scope: d.scope || scope,
        filters: d.filters || {
          month: month ?? null,
          year: year ?? null,
          search,
        },
        data: d.data || {},
        pagination,
      },
      { status: 200 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("[API_KPLT_GET] Unhandled:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @route POST /api/kplt
 * @description Membuat KPLT baru dari ULOK. Mendukung multipart/form-data untuk upload banyak file sekaligus.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const uploadedPaths: string[] = [];

  try {
    const user = await getCurrentUser();

    // 1. Auth Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canKplt("create", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const contentTypeHeader = req.headers.get("content-type") || "";
    const isMultipart = contentTypeHeader.startsWith("multipart/form-data");

    let ulokId = "";
    let payload: Record<string, unknown> = {};

    // 2. Handle Multipart / JSON
    if (isMultipart) {
      const form = await req.formData().catch(() => null);
      if (!form)
        return NextResponse.json(
          { error: "Invalid multipart form" },
          { status: 400 }
        );

      ulokId = String(form.get("ulok_id") ?? "").trim();
      if (!isUuid(ulokId))
        return NextResponse.json({ error: "Invalid ulok_id" }, { status: 422 });

      // Ambil field text biasa
      for (const [k, v] of form.entries()) {
        if (k === "ulok_id") continue;
        if (typeof v === "string") {
          // Normalisasi empty string -> null untuk progress_toko
          payload[k] = k === "progress_toko" && v === "" ? null : v;
        }
      }

      // --- LOGIKA UPLOAD PARALEL ---
      // Kumpulkan semua file yang valid ke dalam antrian upload
      const uploadsToProcess: Array<{
        path: string;
        file: File;
        mime: string;
      }> = [];

      // Helper validasi file
      const validateAndQueue = async (
        field: string,
        allowedMime: readonly string[],
        maxSize: number,
        validatorFn: (f: File) => Promise<{ ok: boolean; reason?: string }>,
        uploadMimeType: string
      ) => {
        const entry = form.get(field);
        if (entry && entry instanceof File) {
          if (entry.size === 0) throw new Error(`File ${field} kosong`);
          if (entry.size > maxSize)
            throw new Error(
              `File ${field} terlalu besar (max ${maxSize / 1024 / 1024}MB)`
            );

          if (entry.type && !allowedMime.includes(entry.type)) {
            throw new Error(`Invalid content-type for ${field}`);
          }

          const check = await validatorFn(entry);
          if (!check.ok)
            throw new Error(`File ${field} invalid: ${check.reason}`);

          const path = buildPathByField(
            ulokId,
            "kplt",
            field,
            entry.name,
            entry.type
          );

          // Masukkan ke payload DB & Queue Upload
          payload[field] = path;
          uploadsToProcess.push({
            path,
            file: entry,
            mime: entry.type || uploadMimeType,
          });

          // Track path untuk rollback jika gagal nanti
          uploadedPaths.push(path);
        }
      };

      // Proses tiap kategori file (Validasi dulu, belum upload)
      try {
        // PDF
        for (const f of PDF_FIELDS)
          await validateAndQueue(
            f,
            MIME.pdf,
            MAX_DOC_SIZE,
            isPdfFile,
            "application/pdf"
          );
        // Excel
        for (const f of EXCEL_FIELDS)
          await validateAndQueue(
            f,
            MIME.excel,
            MAX_DOC_SIZE,
            isExcelFile,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );
        // Video
        for (const f of VIDEO_FIELDS)
          await validateAndQueue(
            f,
            MIME.video,
            MAX_VIDEO_SIZE,
            isVideoFile,
            "video/mp4"
          );
        // Images
        for (const f of IMAGE_FIELDS)
          await validateAndQueue(
            f,
            MIME.image,
            MAX_DOC_SIZE,
            isImageFile,
            "image/png"
          );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (validationErr: any) {
        return NextResponse.json(
          { error: validationErr.message },
          { status: 400 }
        );
      }

      // Eksekusi Upload secara PARALEL (Performa Boost)
      await Promise.all(
        uploadsToProcess.map((item) =>
          uploadFileToStorage(supabase, item.path, item.file, item.mime)
        )
      );
    } else {
      // JSON Mode
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object")
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

      ulokId = String(body.ulok_id ?? "").trim();
      if (!isUuid(ulokId))
        return NextResponse.json({ error: "Invalid ulok_id" }, { status: 422 });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ulok_id: _, ...rest } = body;
      payload = rest;
    }

    // 3. Validasi Zod Schema
    const parsed = KpltCreateMultipartSchema.safeParse(payload);
    if (!parsed.success) {
      // Rollback file jika validasi data gagal
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove(uploadedPaths)
          .catch(() => {});
      }
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    // 4. Insert DB via RPC
    const { data, error } = await supabase.rpc("fn_kplt_create_from_ulok", {
      p_user_id: user.id,
      p_ulok_id: ulokId,
      p_payload: parsed.data,
    });

    // 5. Handle DB Error
    if (error) {
      // Rollback file jika DB gagal
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove(uploadedPaths)
          .catch(() => {});
      }

      const code = isDbError(error) ? error.code : undefined;
      const detail = isDbError(error)
        ? error.message || "Unknown error"
        : String(error);

      // Mapping Error Code Postgres ke HTTP Status
      if (code === "23505")
        return NextResponse.json(
          { error: "Conflict", message: "KPLT already exists for this ULOK" },
          { status: 409 }
        );
      if (code === "23503")
        return NextResponse.json(
          { error: "Not Found", message: "ULOK not found" },
          { status: 404 }
        );
      if (code === "42501")
        return NextResponse.json(
          { error: "Forbidden", message: detail },
          { status: 403 }
        );

      console.error("[API_KPLT_POST] RPC Error:", error);
      return NextResponse.json(
        { error: "Database Error", message: "Gagal menyimpan KPLT" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error("[API_KPLT_POST] Unhandled:", e);
    // Rollback file jika server crash
    if (uploadedPaths.length > 0) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(uploadedPaths)
        .catch(() => {});
    }
    return NextResponse.json(
      { error: "Server Error", message: "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}
