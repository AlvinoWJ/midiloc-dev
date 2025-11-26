/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canProgressKplt } from "@/lib/auth/acl";

function decodeCursor(
  encoded?: string | null
): { created_at: string; id: string } | null {
  if (!encoded) return null;
  try {
    const base = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      base.length % 4 === 0 ? base : base + "=".repeat(4 - (base.length % 4));
    const raw = Buffer.from(pad, "base64").toString("utf8");
    const obj = JSON.parse(raw);
    if (obj.created_at && obj.id)
      return { created_at: obj.created_at, id: obj.id };
  } catch {}
  return null;
}

function encodeCursor(
  created_at?: string | null,
  id?: string | null
): string | null {
  if (!created_at || !id) return null;
  const json = JSON.stringify({ created_at, id });
  return Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

// GET /api/progress-kplt?limit=10&after=<cursor>&before=<cursor>&q=&status=&month=&year=
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  if (!canProgressKplt("read", user))
    return NextResponse.json(
      {
        success: false,
        error: "Forbidden",
        message: "Anda tidak berhak melakukan aksi ini",
      },
      { status: 403 }
    );
  if (!user.branch_id)
    return NextResponse.json(
      { success: false, error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const url = new URL(req.url);
  const q = (
    url.searchParams.get("q") ||
    url.searchParams.get("search") ||
    ""
  ).trim();
  const status = (url.searchParams.get("status") || "").trim() || null;

  // Month/Year
  const mRaw = url.searchParams.get("month") ?? url.searchParams.get("bulan");
  const yRaw = url.searchParams.get("year") ?? url.searchParams.get("tahun");
  const month = mRaw ? Number(mRaw) : undefined;
  const year = yRaw ? Number(yRaw) : undefined;
  const validMonth = (v: unknown) =>
    Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 12;
  const validYear = (v: unknown) =>
    Number.isInteger(v) && (v as number) >= 1970 && (v as number) <= 2100;
  if ((mRaw && !validMonth(month)) || (yRaw && !validYear(year))) {
    return NextResponse.json(
      {
        success: false,
        error: "Bad Request",
        message: "Invalid month/year. month=1..12, year=1970..2100",
      },
      { status: 422 }
    );
  }

  const limitRaw = Number(url.searchParams.get("limit") ?? "10");
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 10;

  // Encoded cursors
  const afterDecoded = decodeCursor(url.searchParams.get("after"));
  const beforeDecoded = decodeCursor(url.searchParams.get("before"));

  const { data, error } = await supabase.rpc("fn_progress_kplt_dashboard", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_position: String((user as any).position_nama ?? "").toLowerCase(),
    p_search: q || null,
    p_status: status,
    p_limit: limit,
    p_month: month ?? null,
    p_year: year ?? null,
    p_after_created_at: afterDecoded?.created_at ?? null,
    p_after_id: afterDecoded?.id ?? null,
    p_before_created_at: beforeDecoded?.created_at ?? null,
    p_before_id: beforeDecoded?.id ?? null,
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

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const { data: rows, pagination, filters, success, ...rest } = data as any;

    // Ambil raw start/end dari RPC untuk di-encode kembali
    const startCursor = encodeCursor(
      pagination?.start_created_at,
      pagination?.start_id
    );
    const endCursor = encodeCursor(
      pagination?.end_created_at,
      pagination?.end_id
    );

    const finalPagination = {
      limit: pagination?.limit,
      count: pagination?.count,
      total: pagination?.total,
      hasNextPage: pagination?.hasNextPage,
      hasPrevPage: pagination?.hasPrevPage,
      startCursor,
      endCursor,
    };

    return NextResponse.json(
      {
        success: Boolean(success),
        ...rest,
        filters,
        data: rows,
        pagination: finalPagination,
      },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { success: true, data: [], pagination: {} },
    { status: 200 }
  );
}
