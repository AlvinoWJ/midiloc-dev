/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canUlok } from "@/lib/auth/acl";

function roleFromPositionName(
  name?: string | null
): "rm" | "bm" | "lm" | "ls" | undefined {
  if (!name) return undefined;
  const key = name.trim().toLowerCase();
  if (key === "regional manager") return "rm";
  if (key === "branch manager") return "bm";
  if (key === "location manager") return "lm";
  if (key === "location specialist") return "ls";
  return undefined;
}

// GET /api/ulok-eksternal?page=1&limit=10
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

    const positionName = user.position_nama ?? null;
    const role = roleFromPositionName(positionName);
    if (!role) {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden",
          error: `Unsupported position '${positionName ?? "-"}'`,
        },
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

    const searchName = (searchParams.get("search") || "").trim();

    // Filter bulan/tahun (month|bulan, year|tahun)
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

    // Hitung rentang waktu UTC untuk filter created_at
    // Jika hanya month diberikan, default ke tahun UTC saat ini
    let startISO: string | undefined;
    let endISO: string | undefined;

    if (month && year) {
      const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const end = new Date(Date.UTC(nextYear, nextMonth - 1, 1, 0, 0, 0, 0));
      startISO = start.toISOString();
      endISO = end.toISOString();
    } else if (year && !month) {
      const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
      startISO = start.toISOString();
      endISO = end.toISOString();
    } else if (!year && month) {
      const nowUTC = new Date();
      const y = nowUTC.getUTCFullYear();
      const start = new Date(Date.UTC(y, month - 1, 1, 0, 0, 0, 0));
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? y + 1 : y;
      const end = new Date(Date.UTC(nextYear, nextMonth - 1, 1, 0, 0, 0, 0));
      startISO = start.toISOString();
      endISO = end.toISOString();
    }

    // Kolom list view untuk frontend:
    // - status_ulok_eksternal (approval status)
    // - created_at (tidak ada kolom nama)
    // - branch_id & penanggungjawab diminta eksplisit
    // Ambil nama branch dari relasi branch_id
    const listColumns = [
      "id",
      "status_ulok_eksternal",
      "created_at",
      "branch_id",
      "penanggungjawab",
      "alamat",
      "nama_pemilik", // relasi ke tabel branch, ambil kolom nama
    ].join(",");

    let query = supabase
      .from("ulok_eksternal")
      .select(listColumns, { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (startISO && endISO) {
      // Filter created_at dalam rentang [start, end)
      query = query.gte("created_at", startISO).lt("created_at", endISO);
    }

    if (searchName) {
      query = query.or(
        `nama_pemilik.ilike.%${searchName}%,alamat.ilike.%${searchName}%`
      );
    }

    // Filter berdasarkan posisi
    if (role === "ls") {
      // Location Specialist: hanya yang penanggungjawab = user.id
      query = query.eq("penanggungjawab", user.id);
    } else if (role === "bm" || role === "lm") {
      // Branch/Location Manager: berdasarkan branch_id user
      if (!(user as any)?.branch_id) {
        return NextResponse.json(
          { success: false, message: "Forbidden", error: "User has no branch" },
          { status: 403 }
        );
      }
      query = query.eq("branch_id", (user as any).branch_id);
    } else {
      // RM: melihat semua (tanpa filter)
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data ULOK Eksternal",
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
        search: searchName,
        pagination,
        filters: {
          month: month ?? null,
          year: year ?? null,
        },
        data,
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
