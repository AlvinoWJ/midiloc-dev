/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canUlokEksisting } from "@/lib/auth/acl";

function decodeCursor(
  encoded?: string | null
): { tgl_go: string; id: string } | null {
  if (!encoded) return null;
  try {
    const base = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad =
      base.length % 4 === 0 ? base : base + "=".repeat(4 - (base.length % 4));
    const raw = Buffer.from(pad, "base64").toString("utf8");
    const obj = JSON.parse(raw);
    if (obj.tgl_go && obj.id) return { tgl_go: obj.tgl_go, id: obj.id };
  } catch {}
  return null;
}

function encodeCursor(
  tgl_go?: string | null,
  id?: string | null
): string | null {
  if (!tgl_go || !id) return null;
  const json = JSON.stringify({ tgl_go, id });
  return Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

// GET /api/ulok-eksisting?limit=20&search=alfamart&month=11&year=2025&after=<cursor>
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (!canUlokEksisting("read", user)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const limitRaw = Number(url.searchParams.get("limit") ?? "20");
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 20;

    const search =
      (
        url.searchParams.get("search") ||
        url.searchParams.get("q") ||
        ""
      ).trim() || null;

    const monthRaw =
      url.searchParams.get("month") ?? url.searchParams.get("bulan");
    const yearRaw =
      url.searchParams.get("year") ?? url.searchParams.get("tahun");

    const month = monthRaw ? Number(monthRaw) : undefined;
    const year = yearRaw ? Number(yearRaw) : undefined;

    const validMonth = (m: unknown) =>
      Number.isInteger(m) && (m as number) >= 1 && (m as number) <= 12;
    const validYear = (y: unknown) =>
      Number.isInteger(y) && (y as number) >= 1970 && (y as number) <= 2100;

    if ((monthRaw && !validMonth(month)) || (yearRaw && !validYear(year))) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid month/year. month=1..12 year=1970..2100",
        },
        { status: 422 }
      );
    }

    const after = decodeCursor(url.searchParams.get("after"));
    const afterTglGo = after?.tgl_go ?? null;
    const afterId = after?.id ?? null;

    const { data, error } = await supabase.rpc("fn_ulok_eksisting_dashboard", {
      p_actor_user_id: user.id,
      p_limit: limit,
      p_search: search,
      p_month: month ?? null,
      p_year: year ?? null,
      p_after_tgl_go: afterTglGo,
      p_after_progress_id: afterId,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message ?? String(error) },
        { status: 500 }
      );
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json(
        {
          success: true,
          filters: { search, month: month ?? null, year: year ?? null },
          data: [],
          pagination: { limit, count: 0 },
        },
        { status: 200 }
      );
    }

    const payload: any = data;
    const pag = payload.pagination || {};

    const startCursor = encodeCursor(pag.start_created_at, pag.start_id);
    const endCursor = encodeCursor(pag.end_created_at, pag.end_id);

    const finalPagination = {
      limit: pag.limit,
      count: pag.count,
      hasNextPage: pag.hasNextPage,
      hasPrevPage: pag.hasPrevPage,
      startCursor,
      endCursor,
    };

    return NextResponse.json(
      {
        success: payload.success,
        filters: payload.filters,
        data: payload.data,
        pagination: finalPagination,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
