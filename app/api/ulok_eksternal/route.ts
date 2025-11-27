/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canUlokEksternal } from "@/lib/auth/acl";

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

// GET /api/ulok-eksternal?scope=history&limit=10&after=<cursor>&before=<cursor>&search=&month=&year=
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", message: "User must login" },
        { status: 401 }
      );
    }
    if (!canUlokEksternal("read", user)) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "Access denied" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const scope = (url.searchParams.get("scope") || "recent").toLowerCase() as
      | "recent"
      | "history";
    const search = (
      url.searchParams.get("search") ||
      url.searchParams.get("q") ||
      ""
    ).trim();

    // Month / Year
    const monthRaw =
      url.searchParams.get("month") ?? url.searchParams.get("bulan");
    const yearRaw =
      url.searchParams.get("year") ?? url.searchParams.get("tahun");
    const month = monthRaw ? Number(monthRaw) : undefined;
    const year = yearRaw ? Number(yearRaw) : undefined;

    const validMonth = (v: unknown) =>
      Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 12;
    const validYear = (v: unknown) =>
      Number.isInteger(v) && (v as number) >= 1970 && (v as number) <= 2100;
    if ((monthRaw && !validMonth(month)) || (yearRaw && !validYear(year))) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          message: "Invalid month/year. month=1..12 year=1970..2100",
        },
        { status: 422 }
      );
    }

    const limitRaw = Number(url.searchParams.get("limit") ?? "10");
    const limit =
      Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 10;

    // Cursors
    const afterDecoded = decodeCursor(url.searchParams.get("after"));
    const beforeDecoded = decodeCursor(url.searchParams.get("before"));

    const { data, error } = await supabase.rpc(
      "fn_ulok_eksternal_dashboard",
      {
        p_user_id: user.id,
        p_branch_id: user.branch_id,
        p_position: String((user as any).position_nama ?? "").toLowerCase(),
        p_scope: scope,
        p_search: search || null,
        p_limit: limit,
        p_month: month ?? null,
        p_year: year ?? null,
        p_after_created_at: afterDecoded?.created_at ?? null,
        p_after_id: afterDecoded?.id ?? null,
        p_before_created_at: beforeDecoded?.created_at ?? null,
        p_before_id: beforeDecoded?.id ?? null,
      }
    );

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

    // Fallback kalau fungsi lama masih return startCursor/endCursor langsung
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const d: any = data;
      const pag = d.pagination || {};

      // Ambil raw jika ada (baru), atau decode encoded lama jika tersedia
      let startCreatedAt: string | null = pag.start_created_at ?? null;
      let startId: string | null = pag.start_id ?? null;
      let endCreatedAt: string | null = pag.end_created_at ?? null;
      let endId: string | null = pag.end_id ?? null;

      // Jika raw null tetapi ada startCursor (versi lama), coba decode untuk tetap jalan
      if ((!startCreatedAt || !startId) && pag.startCursor) {
        const dec = decodeCursor(pag.startCursor);
        if (dec) {
          startCreatedAt = dec.created_at;
          startId = dec.id;
        }
      }
      if ((!endCreatedAt || !endId) && pag.endCursor) {
        const dec = decodeCursor(pag.endCursor);
        if (dec) {
          endCreatedAt = dec.created_at;
          endId = dec.id;
        }
      }

      const startCursor = encodeCursor(startCreatedAt, startId);
      const endCursor = encodeCursor(endCreatedAt, endId);

      const finalPagination = {
        count: pag.count ?? 0,
        limit: pag.limit ?? limit,
        order: pag.order ?? "desc",
        hasNextPage: !!pag.hasNextPage,
        hasPrevPage: !!pag.hasPrevPage,
        startCursor,
        endCursor,
      };

      return NextResponse.json(
        {
          success: Boolean(d.success),
          scope: d.scope,
          filters: d.filters,
          data: d.data,
          pagination: finalPagination,
        },
        { status: 200 }
      );
    }

    // Bentuk default kalau format tak sesuai
    return NextResponse.json(
      {
        success: true,
        scope,
        filters: { month: month ?? null, year: year ?? null, search },
        data: [],
        pagination: {
          count: 0,
          limit,
          order: "desc",
          hasNextPage: false,
          hasPrevPage: false,
          startCursor: null,
          endCursor: null,
        },
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan server internal",
        error:
          process.env.NODE_ENV === "development"
            ? e?.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}
