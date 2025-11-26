import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/acl";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function parseIntParam(val: string | null): number | null {
  if (!val) return null;
  const n = Number(val);
  return Number.isInteger(n) ? n : null;
}

function parseFloatParam(val: string | null): number | null {
  if (!val) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function parseBoolParam(val: string | null, def = false): boolean {
  if (val === null) return def;
  const s = val.trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

function isUuidLike(val: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    val
  );
}

function parseCursor(val: string | null): {
  created_at: string | null;
  id: string | null;
} {
  if (!val) return { created_at: null, id: null };
  const i = val.indexOf("|");
  if (i === -1) return { created_at: null, id: null };
  const ts = val.slice(0, i);
  const id = val.slice(i + 1);
  return { created_at: ts || null, id: id || null };
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "unauthorized", message: "User must login" },
        { status: 401 }
      );
    }
    if (!user.branch_id) {
      return NextResponse.json(
        { error: "forbidden", message: "User has no branch" },
        { status: 403 }
      );
    }

    const sp = req.nextUrl.searchParams;

    // Common params
    const yearParam = sp.get("year");
    const p_year = parseIntParam(yearParam);
    if (yearParam && p_year === null) {
      return NextResponse.json(
        { error: "bad_request", message: "Invalid 'year' query param" },
        { status: 400 }
      );
    }

    let p_branch_filter: string | null = null;
    const branchParam = sp.get("branch_id");
    if (branchParam && branchParam.trim() !== "") {
      const val = branchParam.trim();
      if (!isUuidLike(val)) {
        return NextResponse.json(
          { error: "bad_request", message: "Invalid 'branch_id' format" },
          { status: 400 }
        );
      }
      p_branch_filter = val;
    }

    let p_ls_id: string | null = null;
    const lsParam = sp.get("ls_id");
    if (lsParam && lsParam.trim() !== "") {
      const val = lsParam.trim();
      if (!isUuidLike(val)) {
        return NextResponse.json(
          { error: "bad_request", message: "Invalid 'ls_id' format" },
          { status: 400 }
        );
      }
      p_ls_id = val;
    }

    // Points-specific params
    const p_ulok_only_ok = parseBoolParam(sp.get("ulok_only_ok"), false);
    const p_ulok_without_kplt = parseBoolParam(
      sp.get("ulok_without_kplt"),
      false
    );

    const p_min_lat = parseFloatParam(sp.get("min_lat"));
    const p_min_lng = parseFloatParam(sp.get("min_lng"));
    const p_max_lat = parseFloatParam(sp.get("max_lat"));
    const p_max_lng = parseFloatParam(sp.get("max_lng"));
    if (
      [p_min_lat, p_min_lng, p_max_lat, p_max_lng].some((v) => v !== null) &&
      [p_min_lat, p_min_lng, p_max_lat, p_max_lng].some((v) => v === null)
    ) {
      return NextResponse.json(
        {
          error: "bad_request",
          message:
            "If using map viewport, all of min_lat,min_lng,max_lat,max_lng are required",
        },
        { status: 400 }
      );
    }

    const p_page_size_raw = parseIntParam(sp.get("page_size"));
    const p_page_size =
      p_page_size_raw && p_page_size_raw > 0 ? p_page_size_raw : 1000;

    const { created_at: ulokCurTs, id: ulokCurId } = parseCursor(
      sp.get("ulok_cursor")
    );
    const { created_at: kpltCurTs, id: kpltCurId } = parseCursor(
      sp.get("kplt_cursor")
    );

    const p_search = sp.get("search") || null;

    // Panggil kedua RPC secara paralel
    const [summaryRes, pointsRes] = await Promise.all([
      supabase.rpc("rpc_dashboard", {
        p_user_id: user.id,
        p_year,
        p_branch_filter,
        p_ls_id,
      }),
      supabase.rpc("fn_dashboard_points", {
        p_user_id: user.id,
        p_year,
        p_ls_id,
        p_branch_filter,
        p_search,
        p_ulok_only_ok,
        p_ulok_without_kplt,
        p_min_lat,
        p_min_lng,
        p_max_lat,
        p_max_lng,
        p_page_size,
        p_ulok_cursor_created_at: ulokCurTs,
        p_ulok_cursor_id: ulokCurId,
        p_kplt_cursor_created_at: kpltCurTs,
        p_kplt_cursor_id: kpltCurId,
      }),
    ]);

    // Tangani error keduanya
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sumPgErr = summaryRes.error as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ptsPgErr = pointsRes.error as any;

    if (sumPgErr?.code === "22023") {
      return NextResponse.json(
        { error: "bad_request", message: summaryRes.error?.message },
        { status: 400 }
      );
    }
    if (ptsPgErr?.code === "22023") {
      return NextResponse.json(
        { error: "bad_request", message: pointsRes.error?.message },
        { status: 400 }
      );
    }
    if (summaryRes.error) {
      console.error("Supabase RPC Error (summary):", summaryRes.error);
      return NextResponse.json(
        { error: "rpc_error", message: summaryRes.error.message },
        { status: 500 }
      );
    }
    if (pointsRes.error) {
      console.error("Supabase RPC Error (points):", pointsRes.error);
      return NextResponse.json(
        { error: "rpc_error", message: pointsRes.error.message },
        { status: 500 }
      );
    }

    if (!summaryRes.data) {
      return NextResponse.json(
        { error: "not_found", message: "Summary not found." },
        { status: 404 }
      );
    }
    if (!pointsRes.data) {
      return NextResponse.json(
        { error: "not_found", message: "Points not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      summary: summaryRes.data,
      points: pointsRes.data,
    });
  } catch (err) {
    console.error("Server Error (dashboard full):", err);
    return NextResponse.json(
      { error: "server_error", message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
