/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { UlokCreateSchema } from "@/lib/validations/ulok";
import { getCurrentUser, canUlok } from "@/lib/auth/acl";

// (Opsional) tipe respons umum
type UlokSuccessResponse<T = any> = {
  success: true;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  // Bisa tambahkan meta kalau perlu
  meta?: any;
};

type UlokErrorResponse = {
  success: false;
  message: string;
  error: string | any;
};

// Helper kirim error ringkas ala signUp
function errorResponse(status: number, message: string, error: string | any) {
  const body: UlokErrorResponse = {
    success: false,
    message,
    error,
  };
  return NextResponse.json(body, { status });
}

// Helper kirim sukses
function successResponse<T>(
  status: number,
  data: T,
  opts?: {
    message?: string;
    pagination?: UlokSuccessResponse["pagination"];
    meta?: any;
  }
) {
  const body: UlokSuccessResponse<T> = {
    success: true,
    data,
    ...(opts?.message ? { message: opts.message } : {}),
    ...(opts?.pagination ? { pagination: opts.pagination } : {}),
    ...(opts?.meta ? { meta: opts.meta } : {}),
  };
  return NextResponse.json(body, { status });
}

// GET /api/ulok?page=1&limit=10
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse(401, "Unauthorized", "User must login");
    }
    if (!canUlok("read", user)) {
      return errorResponse(403, "Forbidden", "Access denied");
    }
    if (!user.branch_id) {
      return errorResponse(403, "Forbidden", "User has no branch");
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
      return errorResponse(500, "Gagal mengambil data ULOK", error.message);
    }

    const total = count ?? 0;
    const pagination = {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: total ? Math.ceil(total / safeLimit) : 0,
    };

    return successResponse(200, data, {
      pagination,
    });
  } catch (err: any) {
    // Fallback internal error
    return errorResponse(
      500,
      "Terjadi kesalahan server internal",
      process.env.NODE_ENV === "development"
        ? err?.message ?? String(err)
        : "Internal server error"
    );
  }
}

// POST /api/ulok
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse(401, "Unauthorized", "User must login");
    }
    if (!canUlok("create", user)) {
      return errorResponse(403, "Forbidden", "Access denied");
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return errorResponse(400, "Request body invalid", "Invalid JSON body");
    }

    const parsed = UlokCreateSchema.safeParse(body);
    if (!parsed.success) {
      // Kamu bisa pilih apakah mau hanya string ringkas atau seluruh issues
      return NextResponse.json<UlokErrorResponse>(
        {
          success: false,
          message: "Validasi gagal",
          error: parsed.error.issues, // front-end bisa mapping sendiri
        },
        { status: 422 }
      );
    }

    const payload = parsed.data;

    const { data, error } = await supabase
      .from("ulok")
      .insert({
        users_id: user.id,
        branch_id: user.branch_id,
        ...payload,
      })
      .select("*")
      .single();

    if (error) {
      // Mapping beberapa kode Postgres umum (opsional)
      if (error.code === "23505") {
        return errorResponse(409, "Konflik data", "Data sudah terdaftar");
      }
      return errorResponse(500, "Gagal membuat data ULOK", error.message);
    }

    return successResponse(201, data, {
      message: "Data ULOK berhasil dibuat",
    });
  } catch (err: any) {
    return errorResponse(
      500,
      "Terjadi kesalahan server internal",
      process.env.NODE_ENV === "development"
        ? err?.message ?? String(err)
        : "Internal server error"
    );
  }
}
