/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UlokCreateSchema } from "@/lib/validations/ulok";
import { getCurrentUser, canUlok } from "@/lib/auth/acl";
import { buildPathByField } from "@/lib/storage/path";

const BUCKET = "file_storage";
const MAX_PDF_SIZE = 15 * 1024 * 1024; // 15MB

async function isPdfFile(
  file: File,
  strictSignature = true
): Promise<{ ok: boolean; reason?: string }> {
  const nameOk = file.name.toLowerCase().endsWith(".pdf");
  if (!nameOk) return { ok: false, reason: "Ekstensi harus .pdf" };
  if (file.type && file.type !== "application/pdf") {
    return {
      ok: false,
      reason: `MIME bukan application/pdf (detected: ${file.type})`,
    };
  }
  if (!strictSignature) return { ok: true };
  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const sig = new TextDecoder().decode(header);
  if (!sig.startsWith("%PDF-"))
    return { ok: false, reason: "Header file bukan signature PDF (%PDF-)" };
  return { ok: true };
}

function dropForbiddenFields<T extends Record<string, unknown>>(obj: T) {
  const forbidden = new Set([
    "users_id",
    "branch_id",
    "approval_intip",
    "tanggal_approval_intip",
    "file_intip",
    "approval_status",
    "approved_at",
    "approved_by",
    "updated_at",
    "updated_by",
    "id",
    "created_at",
    "is_active",
    "form_ulok", // file di-handle terpisah
  ]);
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (!forbidden.has(k)) clean[k] = v;
  }
  return clean;
}

function coerceNumbers(raw: Record<string, unknown>) {
  // Koersi numeric fields dari string → number
  const numKeys = ["lebar_depan", "panjang", "luas", "harga_sewa"];
  const intKeys = ["jumlah_lantai"];

  for (const k of numKeys) {
    if (raw[k] != null) {
      const s = String(raw[k]).replace(",", ".").trim();
      const n = s === "" ? NaN : Number(s);
      raw[k] = Number.isFinite(n) ? n : raw[k];
    }
  }
  for (const k of intKeys) {
    if (raw[k] != null) {
      const s = String(raw[k]).trim();
      const n = s === "" ? NaN : Number.parseInt(s, 10);
      raw[k] = Number.isFinite(n) ? n : raw[k];
    }
  }
  return raw;
}

// GET /api/ulok?page=1&limit=10
const BLOCK_SIZE = 90; // BE selalu kirim 90 per blok
const PAGE_SIZE_UI = 9; // referensi untuk FE

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized", error: "User must login" },
        { status: 401 }
      );
    }
    if (!canUlok("read", user)) {
      return NextResponse.json(
        { success: false, message: "Forbidden", error: "Access denied" },
        { status: 403 }
      );
    }
    if (!user.branch_id) {
      return NextResponse.json(
        { success: false, message: "Forbidden", error: "User has no branch" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    // page = nomor blok (1-based)
    const rawPage = Number(searchParams.get("page") ?? "1");
    const blockPage = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

    const scope = (searchParams.get("scope") || "recent").toLowerCase();
    const isRecent = scope === "recent";
    const isHistory = scope === "history";
    const isAll = scope === "all";

    if (!isRecent && !isHistory && !isAll) {
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request",
          error: "scope must be 'recent' or 'history'",
        },
        { status: 422 }
      );
    }

    // withCount: planned (cepat), exact (mahal), none
    const withCount = (
      searchParams.get("withCount") || "planned"
    ).toLowerCase();
    const countOption =
      withCount === "exact"
        ? "exact"
        : withCount === "planned"
        ? "planned"
        : undefined;

    const searchName = (searchParams.get("search") || "").trim();
    const specialistId = searchParams.get("specialist_id") || "";

    // Filter bulan/tahun
    const monthParam = searchParams.get("month") ?? searchParams.get("bulan");
    const yearParam = searchParams.get("year") ?? searchParams.get("tahun");
    const month = monthParam ? Number(monthParam) : undefined;
    const year = yearParam ? Number(yearParam) : undefined;

    const isValidMonth = (m: unknown) =>
      Number.isInteger(m) && (m as number) >= 1 && (m as number) <= 12;
    const isValidYear = (y: unknown) =>
      Number.isInteger(y) && (y as number) >= 1970 && (y as number) <= 2100;

    if (
      (monthParam && !isValidMonth(month)) ||
      (yearParam && !isValidYear(year))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request",
          error: "Invalid month/year. Example: month=1..12, year=1970..2100",
        },
        { status: 422 }
      );
    }

    // Rentang waktu UTC (opsional)
    let startISO: string | undefined;
    let endISO: string | undefined;
    if (month && year) {
      const start = new Date(Date.UTC(year, month - 1, 1));
      const nm = month === 12 ? 1 : month + 1;
      const ny = month === 12 ? year + 1 : year;
      const end = new Date(Date.UTC(ny, nm - 1, 1));
      startISO = start.toISOString();
      endISO = end.toISOString();
    } else if (year && !month) {
      startISO = new Date(Date.UTC(year, 0, 1)).toISOString();
      endISO = new Date(Date.UTC(year + 1, 0, 1)).toISOString();
    } else if (!year && month) {
      const nowUTC = new Date();
      const y = nowUTC.getUTCFullYear();
      const start = new Date(Date.UTC(y, month - 1, 1));
      const nm = month === 12 ? 1 : month + 1;
      const ny = month === 12 ? y + 1 : y;
      const end = new Date(Date.UTC(ny, nm - 1, 1));
      startISO = start.toISOString();
      endISO = end.toISOString();
    }

    // Kolom list view minimal
    const listColumns = [
      "id",
      "nama_ulok",
      "approval_status",
      "alamat",
      "created_at",
      "latitude",
      "longitude",
      "users_id",
    ].join(",");

    // Range blok (paksa 90)
    const from = (blockPage - 1) * BLOCK_SIZE;
    const to = from + BLOCK_SIZE - 1;

    let query = supabase
      .from("ulok")
      .select(listColumns, { count: countOption as any })
      .eq("branch_id", user.branch_id);

    // Scope status
    if (isRecent) {
      query = query.eq("approval_status", "In Progress");
    } else if (isHistory) {
      query = query.in("approval_status", ["OK", "NOK"]);
    } else if (isAll) {
      query = query.in("approval_status", ["OK", "NOK", "In Progress"]);
    }

    if (startISO && endISO) {
      query = query.gte("created_at", startISO).lt("created_at", endISO);
    }

    // Scoping posisi
    const pos = (user.position_nama || "").toLowerCase();
    if (pos === "location specialist") {
      query = query.eq("users_id", user.id);
    } else if (specialistId && specialistId !== "semua") {
      query = query.eq("users_id", specialistId);
    }

    if (searchName) {
      query = query.ilike("nama_ulok", `%${searchName}%`);
    }

    // Order stabil + paging per blok
    query = query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data ULOK",
          error: error.message,
        },
        { status: 500 }
      );
    }

    const total = typeof count === "number" ? count : 0;
    const totalPagesUi = total ? Math.ceil(total / PAGE_SIZE_UI) : 0;

    const blockCount = data?.length ?? 0;
    const isLastBlock = blockPage * BLOCK_SIZE >= total && total > 0;
    const hasMoreBlocks = !isLastBlock && blockCount === BLOCK_SIZE;

    return NextResponse.json(
      {
        success: true,
        scope: isRecent ? "recent" : "history",
        block: {
          blockPage,
          blockSize: BLOCK_SIZE,
          blockCount,
          hasMoreBlocks,
          isLastBlock,
        },
        pagination: {
          total,
          totalPagesUi,
          withCount: countOption ?? "none",
          pageSizeUi: PAGE_SIZE_UI,
        },
        filters: {
          month: month ?? null,
          year: year ?? null,
          search: searchName || null,
          specialist_id: specialistId || null,
        },
        data: data ?? [],
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server internal",
        error:
          process.env.NODE_ENV === "development"
            ? err?.message ?? String(err)
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// POST /api/ulok
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    if (!canUlok("create", user)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }
    if (!user.branch_id) {
      return NextResponse.json(
        { success: false, message: "User has no branch" },
        { status: 403 }
      );
    }

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.startsWith("multipart/form-data")) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Harus multipart/form-data karena wajib upload file form_ulok",
        },
        { status: 400 }
      );
    }

    const form = await request.formData().catch(() => null);
    if (!form) {
      return NextResponse.json(
        { success: false, message: "Invalid multipart form-data" },
        { status: 400 }
      );
    }

    const file = form.get("form_ulok") as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "File form_ulok wajib dikirim" },
        { status: 422 }
      );
    }
    if (file.size === 0) {
      return NextResponse.json(
        { success: false, message: "File kosong" },
        { status: 422 }
      );
    }
    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { success: false, message: "File melebihi 15MB" },
        { status: 422 }
      );
    }

    const pdfCheck = await isPdfFile(file, true);
    if (!pdfCheck.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "File bukan PDF valid",
          detail: pdfCheck.reason,
        },
        { status: 422 }
      );
    }

    // Ambil field text → parse
    const raw: Record<string, unknown> = {};
    form.forEach((val, keyOrig) => {
      if (val instanceof File) return;
      const key = keyOrig.trim();
      if (key === "form_ulok") return;
      raw[key] = val;
    });

    const sanitized = dropForbiddenFields(coerceNumbers(raw));

    const UlokCreateInputSchema = UlokCreateSchema.omit({
      form_ulok: true as any,
    });
    const parsed = UlokCreateInputSchema.safeParse(sanitized);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validasi gagal",
          error: parsed.error.issues,
        },
        { status: 422 }
      );
    }

    // Generate ULOK ID sebelum upload → path seragam: <ulokId>/ulok/<ts>_form_ulok.pdf
    const newUlokId = crypto.randomUUID();
    const objectPath = buildPathByField(
      newUlokId,
      "ulok",
      "form_ulok",
      file.name,
      file.type
    );

    // Upload file fisik ke bucket seragam
    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, file, {
        upsert: false,
        contentType: "application/pdf",
      });

    if (uploadErr) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal upload file",
          error: uploadErr.message,
        },
        { status: 500 }
      );
    }

    // Simpan path (path relatif; untuk akses, FE bisa generate signed URL)
    const filePathToStore = objectPath;

    const insertPayload = {
      id: newUlokId,
      ...(parsed.data as Record<string, unknown>),
      users_id: user.id,
      branch_id: user.branch_id,
      form_ulok: filePathToStore,
    };

    const { data, error } = await supabase
      .from("ulok")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      // Hapus file jika insert gagal (best-effort)
      await supabase.storage
        .from(BUCKET)
        .remove([objectPath])
        .catch(() => {});
      return NextResponse.json(
        { success: false, message: "Gagal insert ulok", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data ULOK + file form_ulok berhasil dibuat",
        data,
        stored_form_ulok: filePathToStore,
        object_path: objectPath,
      },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server internal",
        error:
          process.env.NODE_ENV === "development"
            ? e?.message
            : "Internal error",
      },
      { status: 500 }
    );
  }
}
