/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
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
    const page = Number(searchParams.get("page") ?? "1");
    const limit = Number(searchParams.get("limit") ?? "10");
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 10;

    const from = (safePage - 1) * safeLimit;
    const to = from + safeLimit - 1;

    // Kolom list view — sesuaikan dengan kebutuhan front-end
    const listColumns = [
      "id",
      "nama_ulok",
      "approval_status",
      "alamat",
      "created_at",
      "latitude",
      "longitude",
    ].join(",");

    const specialistId = searchParams.get("specialist_id");

    let query = supabase
      .from("ulok")
      .select(listColumns, { count: "exact" })
      .eq("branch_id", user.branch_id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (user.position_nama === "location specialist") {
      query = query.eq("users_id", user.id);
    } else {
      if (specialistId && specialistId !== "semua" && specialistId !== "") {
        query = query.eq("users_id", specialistId);
      }
    }

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

    const total = count ?? 0;
    const pagination = {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: total ? Math.ceil(total / safeLimit) : 0,
    };

    return NextResponse.json(
      {
        success: true,
        data: data,
        pagination,
      },
      { status: 200 }
    );
  } catch (err: any) {
    // Fallback internal error
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
