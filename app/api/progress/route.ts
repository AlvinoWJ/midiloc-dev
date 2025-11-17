/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canProgressKplt } from "@/lib/auth/acl";

// GET /api/progress-kplt?q=&status=&kplt_approval=&month=&year=&page=1&limit=10
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  if (!canProgressKplt("read", user)) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }
  if (!user.branch_id) {
    return NextResponse.json(
      { success: false, error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
  }

  const url = new URL(req.url);
  const q = (
    url.searchParams.get("q") ||
    url.searchParams.get("search") ||
    ""
  ).trim();
  const status = (url.searchParams.get("status") || "").trim() || null;

  // Month/Year filters (support alias bulan/tahun)
  const mRaw = url.searchParams.get("month") ?? url.searchParams.get("bulan");
  const yRaw = url.searchParams.get("year") ?? url.searchParams.get("tahun");
  const month = mRaw ? Number(mRaw) : undefined;
  const year = yRaw ? Number(yRaw) : undefined;

  const isValidMonth = (v: unknown) =>
    Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 12;
  const isValidYear = (v: unknown) =>
    Number.isInteger(v) && (v as number) >= 1970 && (v as number) <= 2100;

  if ((mRaw && !isValidMonth(month)) || (yRaw && !isValidYear(year))) {
    return NextResponse.json(
      {
        success: false,
        error: "Bad Request",
        message: "Invalid month/year. month=1..12, year=1970..2100",
      },
      { status: 422 }
    );
  }

  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Number(url.searchParams.get("limit") ?? "10");
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safeLimit =
    Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 10;

  const { data, error } = await supabase.rpc("fn_progress_kplt_dashboard", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_position: String((user as any).position_nama ?? "").toLowerCase(),
    p_search: q || null,
    p_status: status,
    p_page: safePage,
    p_limit: safeLimit,
    p_month: month ?? null,
    p_year: year ?? null,
  });

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch data",
        detail: (error as any).message ?? error,
      },
      { status: 500 }
    );
  }

  // Ensure 'data' is the last property in the response object
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const { data: rows, ...rest } = data as any;
    return NextResponse.json(
      { success: true, ...rest, data: rows },
      { status: 200 }
    );
  }
  return NextResponse.json({ success: true, data }, { status: 200 });
}
