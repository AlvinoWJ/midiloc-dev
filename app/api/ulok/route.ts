/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { UlokCreateSchema } from "@/lib/validations/ulok";
import { getCurrentUser, canUlok } from "@/lib/auth/acl";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function buildObjectPath(ulokId: string, originalName: string) {
  const ext = originalName.includes(".")
    ? "." + originalName.split(".").pop()!.toLowerCase()
    : "";
  const base = slugify(originalName.replace(/\.[^.]+$/, "")) || "file";
  return `${ulokId}/${Date.now()}-${base}${ext}`;
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
      "alamat",
      "latitude",
      "longitude",
    ].join(",");

    let query = supabase
      .from("ulok")
      .select(listColumns, { count: "exact" })
      .eq("branch_id", user.branch_id)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (user.position_nama === "location specialist") {
      query = query.eq("users_id", user.id);
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

    // Ambil file
    const file = form.get("form_ulok") as File | null;
    // alternatif: kalau kamu ingin key "form_ulok" saja:
    // const file = form.get("form_ulok") as File | null;
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
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "File melebihi 15MB" },
        { status: 422 }
      );
    }
    // Validasi PDF only
    const pdfCheck = await isPdfFile(file, true); // true = cek signature
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
      if (key === "form_ulok") return; // ignore kalau user nakal
      raw[key] = val;
    });

    const parsed = UlokCreateSchema.safeParse(raw);
    if (!parsed.success) {
      console.log("VALIDATION ERROR:", parsed.error.issues);
      return NextResponse.json(
        {
          success: false,
          message: "Validasi gagal",
          error: parsed.error.issues,
        },
        { status: 422 }
      );
    }

    const newUlokId = crypto.randomUUID();
    const objectPath = buildObjectPath(newUlokId, file.name);

    // Upload fisik
    const { error: uploadErr } = await supabase.storage
      .from("form_ulok")
      .upload(objectPath, file, { upsert: false });

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

    // Ambil public URL (BUTUH bucket public)
    // const { data: pub } = supabase.storage
    //   .from("form_ulok")
    //   .getPublicUrl(objectPath);
    // const publicUrl = pub.publicUrl;

    // Pilihan A: Simpan publicUrl ke kolom form_ulok
    const fileUrlToStore = objectPath;

    // (Jika mau path saja: const fileUrlToStore = objectPath;)

    // Remove 'form_ulok' from parsed.data to avoid duplicate key
    const { form_ulok, ...parsedDataWithoutFormUlok } = parsed.data;

    const insertPayload = {
      id: newUlokId,
      users_id: user.id,
      branch_id: user.branch_id,
      form_ulok: fileUrlToStore, // langsung simpan link
      ...parsedDataWithoutFormUlok,
    };

    const { data, error } = await supabase
      .from("ulok")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      // (Optional) hapus file kalau insert gagal
      await supabase.storage
        .from("form_ulok")
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
        stored_form_ulok: fileUrlToStore,
        object_path: objectPath, // info tambahan
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
