/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canUlokEksternal } from "@/lib/auth/acl";

// GET /api/ulok-eksternal?limit=10&search=&month=&year=&afterAt=&afterId=
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
    if (!canUlokEksternal("read", user)) {
      return NextResponse.json(
        { success: false, message: "Forbidden", error: "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limitRaw = Number(searchParams.get("limit") ?? "10");
    const safeLimit =
      Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 500) : 10;

    const search = (searchParams.get("search") || "").trim();

    // Month & Year filters (aliases bulan/tahun)
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

    // Cursor params
    const afterAt = searchParams.get("afterAt");
    const afterId = searchParams.get("afterId");

    const { data, error } = await supabase.rpc(
      "fn_ulok_eksternal_dashboard",
      {
        p_user_id: user.id,
        p_branch_id: user.branch_id,
        p_position: String((user as any).position_nama ?? "").toLowerCase(),
        p_search: search || null,
        p_limit: safeLimit,
        p_month: month ?? null,
        p_year: year ?? null,
        p_after_created_at: afterAt ? new Date(afterAt).toISOString() : null,
        p_after_id: afterId || null,
      }
    );

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data ULOK Eksternal",
          error: error.message ?? String(error),
        },
        { status: 500 }
      );
    }

    // Pastikan 'data' di akhir
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const { data: rows, pagination, filters, success, ...rest } = data as any;
      return NextResponse.json(
        {
          success: Boolean(success),
          ...rest,
          filters,
          data: rows,
          pagination,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, data: [], pagination: { limit: safeLimit, count: 0 } },
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
