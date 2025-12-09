import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UlokCreateSchema } from "@/lib/validations/ulok";
import {
  getCurrentUser,
  canUlok,
  isRegionalOrAbove,
  POSITION,
} from "@/lib/auth/acl";
import { buildPathByField } from "@/lib/storage/path";
import { isPdfFile } from "@/utils/fileChecker";

// ==============================================================================
// CONFIG & CONSTANTS
// ==============================================================================
export const dynamic = "force-dynamic"; // Pastikan route ini tidak di-cache statis

const STORAGE_BUCKET = "file_storage";
const UPLOAD_FOLDER = "ulok";
const MAX_PDF_SIZE_MB = 15;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;
const DEFAULT_PAGE_LIMIT = 36;
const MAX_PAGE_LIMIT = 100;

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

/**
 * Mengubah string base64url menjadi objek cursor.
 */
function decodeCursor(encoded?: string | null) {
  if (!encoded) return null;
  try {
    const base = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base.padEnd(base.length + ((4 - (base.length % 4)) % 4), "=");
    const raw = Buffer.from(pad, "base64").toString("utf8");
    return JSON.parse(raw) as { created_at: string; id: string };
  } catch {
    return null;
  }
}

/**
 * Mengubah objek cursor menjadi string base64url.
 */
function encodeCursor(payload: { created_at: string; id: string }) {
  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Membersihkan field object dari properti yang dilarang (security sanitization).
 */
function sanitizePayload(raw: Record<string, unknown>) {
  const forbidden = new Set([
    "id",
    "created_at",
    "updated_at",
    "updated_by",
    "users_id",
    "branch_id",
    "is_active",
    "approval_status",
    "approved_at",
    "approved_by",
    "approval_intip",
    "tanggal_approval_intip",
    "file_intip",
    "form_ulok", // File di-handle terpisah
  ]);

  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (!forbidden.has(key)) {
      clean[key] = val;
    }
  }
  return clean;
}

/**
 * Mengkonversi string numerik dari FormData menjadi tipe number yang valid.
 */
function coerceNumericFields(raw: Record<string, unknown>) {
  const floatFields = ["lebar_depan", "panjang", "luas", "harga_sewa"];
  const intFields = ["jumlah_lantai"];

  for (const key of floatFields) {
    if (typeof raw[key] === "string" || typeof raw[key] === "number") {
      const s = String(raw[key]).replace(",", ".").trim();
      const n = s === "" ? NaN : Number(s);
      if (Number.isFinite(n)) raw[key] = n;
    }
  }

  for (const key of intFields) {
    if (typeof raw[key] === "string" || typeof raw[key] === "number") {
      const s = String(raw[key]).trim();
      const n = s === "" ? NaN : parseInt(s, 10);
      if (Number.isFinite(n)) raw[key] = n;
    }
  }
  return raw;
}

// ==============================================================================
// ROUTE HANDLERS
// ==============================================================================

/**
 * @route GET /api/ulok
 * @description Mengambil daftar Usulan Lokasi (ULOK) dengan pagination cursor-based.
 * @access Private (Memerlukan login & permission 'read')
 *
 * @param {string} scope - 'recent' | 'history' | 'all'
 * @param {string} search - Keyword pencarian nama_ulok
 * @param {string} after - Cursor untuk halaman selanjutnya
 * @param {string} before - Cursor untuk halaman sebelumnya
 * @param {number} year - filter tahun
 * @param {number} month - filter bulan
 * @param {number} limit - batas get data
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth Check
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: Harap login terlebih dahulu",
        },
        { status: 401 }
      );
    }

    if (!canUlok("read", user)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Anda tidak memiliki akses" },
        { status: 403 }
      );
    }

    if (!user.branch_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden: User tidak terasosiasi dengan cabang",
        },
        { status: 403 }
      );
    }

    // 2. Parse Query Params
    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get("scope") || "recent").toLowerCase();
    const searchName = (searchParams.get("search") || "").trim();
    const specialistId = searchParams.get("specialist_id") || "";
    const after = searchParams.get("after") || "";
    const before = searchParams.get("before") || "";

    // Validasi Scope
    if (!["recent", "history", "all"].includes(scope)) {
      return NextResponse.json(
        {
          success: false,
          message: "Scope harus 'recent', 'history', atau 'all'",
        },
        { status: 400 }
      );
    }

    // Pagination Limit
    const limitRaw = Number(searchParams.get("limit") ?? DEFAULT_PAGE_LIMIT);
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(limitRaw, MAX_PAGE_LIMIT)
        : DEFAULT_PAGE_LIMIT;
    const pageSize = limit + 1; // +1 untuk deteksi next page

    // 3. Build Query
    const supabase = await createClient();
    let query = supabase.from("ulok").select(
      "id, nama_ulok, approval_status, alamat, created_at, latitude, longitude, users_id",
      { count: "planned" } // Optimasi count
    );
    if (!isRegionalOrAbove(user)) {
      query = query.eq("branch_id", user.branch_id);
    }

    // Filter Scope
    if (scope === "recent") {
      query = query.eq("approval_status", "In Progress");
    } else if (scope === "history") {
      query = query.in("approval_status", ["OK", "NOK"]);
    } else if (scope === "all") {
      query = query.in("approval_status", ["OK", "NOK", "In Progress"]);
    }

    // Filter Search
    if (searchName) {
      query = query.ilike("nama_ulok", `%${searchName}%`);
    }

    // Filter Role (Location Specialist hanya lihat miliknya sendiri)
    const pos = user.position_nama?.toLowerCase() || "";
    if (pos === POSITION.LOCATION_SPECIALIST) {
      query = query.eq("users_id", user.id);
    } else if (specialistId && specialistId !== "semua") {
      query = query.eq("users_id", specialistId);
    }
    // Filter Tanggal (Opsional)
    // Filter Month (Opsional)
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));
    const now = new Date();
    if (month && !year) {
      const currentYear = now.getUTCFullYear();
      const start = new Date(Date.UTC(currentYear, month - 1, 1));
      const end = new Date(Date.UTC(currentYear, month, 1));
      query = query
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());
    }
    if (year) {
      const start = new Date(Date.UTC(year, month ? month - 1 : 0, 1));
      const end = new Date(
        Date.UTC(year + (month ? 0 : 1), month ? month : 0, 1)
      );
      query = query
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());
    }

    // Sorting Stabil
    query = query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    // Cursor Pagination Logic
    const afterPayload = decodeCursor(after);
    const beforePayload = decodeCursor(before);

    if (afterPayload) {
      query = query.or(
        `created_at.lt.${afterPayload.created_at},and(created_at.eq.${afterPayload.created_at},id.lt.${afterPayload.id})`
      );
    } else if (beforePayload) {
      // Note: Logic 'before' (prev page) seringkali kompleks di infinite scroll standard,
      // tapi untuk simplifikasi kita pakai logika reverse dari 'after' jika diperlukan.
      // Disini kita validasi conflict saja.
      if (afterPayload) {
        return NextResponse.json(
          {
            success: false,
            message: "Tidak boleh mengirim 'after' dan 'before' bersamaan",
          },
          { status: 400 }
        );
      }
      query = query.or(
        `created_at.gt.${beforePayload.created_at},and(created_at.eq.${beforePayload.created_at},id.gt.${beforePayload.id})`
      );
    }

    query = query.limit(pageSize);

    // 4. Execute Query
    const { data, error, count } = await query;

    if (error) {
      console.error("[API_ULOK_GET] Database error:", error);
      throw new Error("Gagal mengambil data dari database");
    }

    const rows = (data || []) as Array<{ created_at: string; id: string }>;
    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;

    // 5. Build Cursors
    const startCursor =
      items.length > 0
        ? encodeCursor({ created_at: items[0].created_at, id: items[0].id })
        : null;
    const endCursor =
      items.length > 0
        ? encodeCursor({
            created_at: items[items.length - 1].created_at,
            id: items[items.length - 1].id,
          })
        : null;

    return NextResponse.json({
      success: true,
      scope,
      data: items,
      pagination: {
        total: count,
        limit,
        hasNextPage,
        hasPrevPage: Boolean(afterPayload || beforePayload),
        startCursor,
        endCursor,
      },
    });
  } catch (error) {
    console.error("[API_ULOK_GET] Unhandled error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}

/**
 * @route POST /api/ulok
 * @description Membuat data Usulan Lokasi baru beserta upload file form_ulok.
 * @access Private (Memerlukan login & permission 'create')
 * @content multipart/form-data
 */
export async function POST(request: NextRequest) {
  let objectPath: string | null = null;
  const supabase = await createClient();

  try {
    // 1. Auth Check
    const user = await getCurrentUser();
    if (!user || !user.branch_id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized or No Branch Assigned" },
        { status: 401 }
      );
    }

    if (!canUlok("create", user)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Hak akses ditolak" },
        { status: 403 }
      );
    }

    // 2. Validate Content-Type
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, message: "Content-Type harus multipart/forms-data" },
        { status: 400 }
      );
    }

    // 3. Parse FormData
    const formData = await request.formData();
    const file = formData.get("form_ulok") as File | null;

    // 4. Validate File
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "File 'form_ulok' wajib diunggah" },
        { status: 400 }
      );
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: `Ukuran file melebihi batas ${MAX_PDF_SIZE_MB}MB`,
        },
        { status: 400 }
      );
    }

    // Deep Check File Type (Magic Number)
    const pdfCheck = await isPdfFile(file);
    if (!pdfCheck.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Format file tidak valid. Harus PDF.",
          detail: pdfCheck.reason,
        },
        { status: 400 }
      );
    }

    // 5. Parse & Validate Fields
    const rawData: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      if (typeof value === "string" && key !== "form_ulok") {
        rawData[key] = value;
      }
    });

    const sanitizedData = sanitizePayload(coerceNumericFields(rawData));

    // Menggunakan schema yang mengecualikan 'form_ulok' karena dihandle manual
    const validation = UlokCreateSchema.omit({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form_ulok: true as any,
    }).safeParse(sanitizedData);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return NextResponse.json(
        { success: false, message: "Data tidak valid", errors },
        { status: 422 }
      );
    }

    // 6. Upload File (Storage)
    const ulokId = crypto.randomUUID();
    objectPath = buildPathByField(
      ulokId,
      UPLOAD_FOLDER,
      "form_ulok",
      file.name,
      file.type
    );

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(objectPath, file, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("[API_ULOK_POST] Upload error:", uploadError);
      return NextResponse.json(
        { success: false, message: "Gagal mengunggah file ke storage" },
        { status: 502 } // Bad Gateway / Upstream Error
      );
    }

    // 7. Insert to Database
    const insertPayload = {
      id: ulokId,
      ...validation.data,
      users_id: user.id,
      branch_id: user.branch_id,
      form_ulok: objectPath, // Path relatif disimpan di DB
      // Field default lain ditangani oleh Database Default Value (created_at, approval_status, dll)
    };

    const { data, error: dbError } = await supabase
      .from("ulok")
      .insert(insertPayload)
      .select()
      .single();

    if (dbError) {
      console.error("[API_ULOK_POST] DB Insert error:", dbError);
      // Rollback: Hapus file jika DB gagal
      if (objectPath) {
        await supabase.storage
          .from(STORAGE_BUCKET)
          .remove([objectPath])
          .catch(() => {});
      }
      return NextResponse.json(
        { success: false, message: "Gagal menyimpan data ke database" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "ULOK berhasil dibuat",
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API_ULOK_POST] Unhandled error:", error);

    // Rollback (Best effort) jika terjadi crash setelah upload tapi sebelum return
    if (objectPath) {
      await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([objectPath])
        .catch(() => {});
    }

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal server" },
      { status: 500 }
    );
  }
}
