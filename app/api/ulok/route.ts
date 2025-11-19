/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UlokCreateSchema } from "@/lib/validations/ulok";
import { getCurrentUser, canUlok } from "@/lib/auth/acl";
import { buildPathByField } from "@/lib/storage/path";

const BUCKET = "file_storage";
const MAX_PDF_SIZE = 15 * 1024 * 1024; // 15MB

const DEFAULT_LIMIT = 36;

// Base64url helpers
function b64urlEncode(s: string) {
  return Buffer.from(s)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
function b64urlDecode(s: string) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4;
  if (pad) s += "=".repeat(4 - pad);
  return Buffer.from(s, "base64").toString("utf8");
}

type CursorPayload = { created_at: string; id: string };
function encodeCursor(p: CursorPayload) {
  return b64urlEncode(JSON.stringify(p));
}
function decodeCursor(c: string): CursorPayload | null {
  try {
    const obj = JSON.parse(b64urlDecode(c));
    if (obj && typeof obj.created_at === "string" && typeof obj.id === "string")
      return obj;
    return null;
  } catch {
    return null;
  }
}

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

    // Limit
    const limitRaw = Number(searchParams.get("limit") ?? String(DEFAULT_LIMIT));
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(limitRaw, 100)
        : DEFAULT_LIMIT;
    const pageSize = limit + 1; // ambil 1 ekstra untuk deteksi hasNext/hasPrev

    // Cursor params
    const after = searchParams.get("after") || ""; // untuk ambil "lebih lama" dari cursor (desc)
    const before = searchParams.get("before") || ""; // untuk ambil "lebih baru" dari cursor (desc)

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

    //scope date
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

    //search
    if (searchName) {
      query = query.ilike("nama_ulok", `%${searchName}%`);
    }

    // Order stabil
    query = query
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    // Terapkan cursor
    const afterPayload = after ? decodeCursor(after) : null;
    const beforePayload = before ? decodeCursor(before) : null;

    if (afterPayload && beforePayload) {
      return NextResponse.json(
        {
          success: false,
          message: "Bad Request",
          error: "Only one of 'after' or 'before' can be provided",
        },
        { status: 422 }
      );
    }

    if (afterPayload) {
      // Ambil item LEBIH LAMA dari cursor (karena urutan desc)
      // Kondisi: created_at < ts OR (created_at = ts AND id < cursor_id)
      const ts = afterPayload.created_at;
      const id = afterPayload.id;
      query = query.or(
        `created_at.lt.${ts},and(created_at.eq.${ts},id.lt.${id})`
      );
    } else if (beforePayload) {
      // Ambil item LEBIH BARU dari cursor (urutan desc), untuk "previous"
      // Kondisi: created_at > ts OR (created_at = ts AND id > cursor_id)
      const ts = beforePayload.created_at;
      const id = beforePayload.id;
      query = query.or(
        `created_at.gt.${ts},and(created_at.eq.${ts},id.gt.${id})`
      );
    }

    // Limit + 1 untuk deteksi hasNext/hasPrev
    query = query.limit(pageSize);

    const { data, error } = await query;

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

    const rows =
      Array.isArray(data) &&
      data.every(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          "created_at" in item &&
          "id" in item
      )
        ? (data as Array<{ created_at: string; id: string }>)
        : [];
    const gotExtra = rows.length > limit;
    const items = gotExtra ? rows.slice(0, limit) : rows;

    const count = items.length;

    // PageInfo
    const startCursor = items.length
      ? encodeCursor({ created_at: items[0].created_at, id: items[0].id })
      : null;
    const endCursor = items.length
      ? encodeCursor({
          created_at: items[items.length - 1].created_at,
          id: items[items.length - 1].id,
        })
      : null;

    // hasNextPage: bila ada ekstra item di sisi "lebih lama" (arah after)
    // - Untuk initial/after: gotExtra = true → masih ada next
    // - Untuk before: kita tetap pakai gotExtra, karena order tetap desc, query mengambil "lebih baru"
    //   sehingga gotExtra menunjukkan masih ada data ke arah yang diminta. Di FE pakai sesuai tombol.
    const hasNextPage =
      !beforePayload && gotExtra
        ? true
        : beforePayload
        ? // saat before (previous), "next" arah mundur/maju tergantung interpretasi FE.
          // Kita sediakan kedua flag berikut; FE akan gunakan sesuai tombol.
          false
        : gotExtra;

    // hasPrevPage heuristik:
    const hasPrevPage = Boolean(afterPayload || beforePayload);

    return NextResponse.json(
      {
        success: true,
        scope,
        filters: {
          month: month ?? null,
          year: year ?? null,
          search: searchName || null,
          specialist_id: specialistId || null,
        },
        data: items,
        pagination: {
          count,
          limit,
          order: "desc",
          startCursor,
          endCursor,
          hasNextPage,
          hasPrevPage,
        },
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
