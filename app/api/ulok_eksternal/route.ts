import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canUlokEksternal } from "@/lib/auth/acl";

export const dynamic = "force-dynamic";

// --- Helper Functions ---
function decodeCursor(encoded?: string | null) {
  if (!encoded) return null;
  try {
    const base = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base.padEnd(base.length + ((4 - (base.length % 4)) % 4), "=");
    const raw = Buffer.from(pad, "base64").toString("utf8");
    return JSON.parse(raw) as { created_at: string; id: string };
  } catch {
    return null;
  }
}

function encodeCursor(created_at?: string | null, id?: string | null) {
  if (!created_at || !id) return null;
  const json = JSON.stringify({ created_at, id });
  return Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 * @route GET /api/ulok_eksternal
 * @description Mengambil daftar Ulok Eksternal untuk dashboard.
 * Mendukung filter (search, month, year, scope) dan cursor-based pagination.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canUlokEksternal("read", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 2. Parse Params
    const url = new URL(req.url);
    const scope = (url.searchParams.get("scope") || "recent").toLowerCase();
    const search = (
      url.searchParams.get("search") ||
      url.searchParams.get("q") ||
      ""
    ).trim();
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "10"), 100);

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

    const afterDecoded = decodeCursor(url.searchParams.get("after"));
    const beforeDecoded = decodeCursor(url.searchParams.get("before"));

    // 3. Execute RPC
    const { data, error } = await supabase.rpc("fn_ulok_eksternal_dashboard", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_position: String(user.position_nama ?? "").toLowerCase(),
      p_scope: scope,
      p_search: search || null,
      p_limit: limit,
      p_month: validMonth ? month : null,
      p_year: validYear ? year : null,
      p_after_created_at: afterDecoded?.created_at ?? null,
      p_after_id: afterDecoded?.id ?? null,
      p_before_created_at: beforeDecoded?.created_at ?? null,
      p_before_id: beforeDecoded?.id ?? null,
    });

    if (error) {
      console.error("[ULOK_EKS_DASHBOARD_RPC]", error);
      return NextResponse.json(
        { error: "Failed to fetch dashboard data" },
        { status: 500 }
      );
    }

    // 4. Format Pagination
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d: any = data || {};
    const pag = d.pagination || {};

    // Support format baru (raw fields) maupun fallback format lama (encoded cursor)
    const startCursor =
      encodeCursor(pag.start_created_at, pag.start_id) || pag.startCursor;
    const endCursor =
      encodeCursor(pag.end_created_at, pag.end_id) || pag.endCursor;

    return NextResponse.json(
      {
        success: Boolean(d.success),
        scope: d.scope,
        filters: d.filters,
        data: d.data ?? [],
        pagination: {
          count: pag.count ?? 0,
          limit: pag.limit ?? limit,
          hasNextPage: !!pag.hasNextPage,
          hasPrevPage: !!pag.hasPrevPage,
          startCursor,
          endCursor,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[ULOK_EKS_DASHBOARD_UNHANDLED]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
