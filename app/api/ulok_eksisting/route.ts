/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canUlokEksisting } from "@/lib/auth/acl";

// --- Helper Functions ---
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

/**
 * @route GET /api/ulok_eksisting
 * @description Mengambil dashboard Ulok Eksisting (Toko Buka).
 * Mendukung filter (search, month, year) dan cursor pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth Check
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

    // 2. Parse Params
    const url = new URL(req.url);
    const search =
      (
        url.searchParams.get("search") ||
        url.searchParams.get("q") ||
        ""
      ).trim() || null;
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "20"), 200);

    const month = Number(
      url.searchParams.get("month") ?? url.searchParams.get("bulan")
    );
    const year = Number(
      url.searchParams.get("year") ?? url.searchParams.get("tahun")
    );

    const validMonth = !isNaN(month) && month >= 1 && month <= 12;
    const validYear = !isNaN(year) && year >= 1970 && year <= 2100;

    if (
      (url.searchParams.has("month") && !validMonth) ||
      (url.searchParams.has("year") && !validYear)
    ) {
      return NextResponse.json(
        { error: "Bad Request: Invalid Date" },
        { status: 422 }
      );
    }

    const after = decodeCursor(url.searchParams.get("after"));

    const { data, error } = await supabase.rpc("fn_ulok_eksisting_dashboard", {
      p_actor_user_id: user.id,
      p_limit: limit,
      p_search: search,
      p_month: validMonth ? month : null,
      p_year: validYear ? year : null,
      p_after_tgl_go: after?.tgl_go ?? null,
      p_after_progress_id: after?.id ?? null,
    });

    if (error) {
      console.error("[ULOK_EKSISTING_DASHBOARD]", error);
      return NextResponse.json(
        { error: "Failed to fetch dashboard data" },
        { status: 500 }
      );
    }

    // 4. Format Response
    const payload: any = data || {};
    const pag = payload.pagination || {};

    // Generate Next/Prev Cursors
    const startCursor = encodeCursor(pag.start_created_at, pag.start_id);
    const endCursor = encodeCursor(pag.end_created_at, pag.end_id);

    return NextResponse.json(
      {
        success: Boolean(payload.success),
        filters: payload.filters,
        data: payload.data ?? [],
        pagination: {
          limit: pag.limit ?? limit,
          count: pag.count ?? 0,
          hasNextPage: !!pag.hasNextPage,
          hasPrevPage: !!pag.hasPrevPage,
          startCursor,
          endCursor,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[ULOK_EKSISTING_DASHBOARD_UNHANDLED]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
