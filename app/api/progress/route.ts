/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";

// GET /api/progress-kplt?q=&status=&kplt_approval=&page=1&limit=10
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  if (!canKplt("read", user)) {
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
  const kpltApproval =
    (url.searchParams.get("kplt_approval") || "").trim() || null;

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
    p_kplt_approval: kpltApproval,
    p_page: safePage,
    p_limit: safeLimit,
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

  // RPC returns: { data: [...], pagination: { page, limit, total, totalPages }, filters: {...} }
  return NextResponse.json(
    { success: true, ...(data as any) },
    { status: 200 }
  );
}
