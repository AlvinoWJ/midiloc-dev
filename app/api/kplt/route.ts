import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";

// base64 sudah dilakukan di fungsi (startCursor / endCursor sudah final)
// Route hanya memforward apa adanya.

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", message: "User must login" },
      { status: 401 }
    );
  }
  if (!canKplt("read", user)) {
    return NextResponse.json(
      { success: false, error: "Forbidden", message: "Access denied" },
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
  const scope = (url.searchParams.get("scope") || "recent").toLowerCase() as
    | "recent"
    | "history";
  const q = (
    url.searchParams.get("q") ||
    url.searchParams.get("search") ||
    ""
  ).trim();

  // Filters
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

  // Recent cursors
  const limitNeedInput = Number(url.searchParams.get("limit") ?? "9");
  const afterNeedInputAt = url.searchParams.get("afterNeedInputAt");
  const afterNeedInputId = url.searchParams.get("afterNeedInputId");

  const limitInProgress = Number(url.searchParams.get("limit") ?? "9");
  const afterInProgressAt = url.searchParams.get("afterInProgressAt");
  const afterInProgressId = url.searchParams.get("afterInProgressId");

  // History cursors
  const limitOk = Number(url.searchParams.get("limit") ?? "9");
  const afterOkAt = url.searchParams.get("afterOkAt");
  const afterOkId = url.searchParams.get("afterOkId");

  const limitNok = Number(url.searchParams.get("limit") ?? "9");
  const afterNokAt = url.searchParams.get("afterNokAt");
  const afterNokId = url.searchParams.get("afterNokId");

  try {
    const { data, error } = await supabase.rpc("fn_kplt_dashboard", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_position: String((user as any).position_nama ?? "").toLowerCase(),
      p_scope: scope,
      p_search: q || null,

      p_limit_need_input: limitNeedInput,
      p_after_need_input_created_at: afterNeedInputAt
        ? new Date(afterNeedInputAt).toISOString()
        : null,
      p_after_need_input_id: afterNeedInputId || null,

      p_limit_in_progress: limitInProgress,
      p_after_in_progress_created_at: afterInProgressAt
        ? new Date(afterInProgressAt).toISOString()
        : null,
      p_after_in_progress_id: afterInProgressId || null,

      p_limit_ok: limitOk,
      p_after_ok_created_at: afterOkAt
        ? new Date(afterOkAt).toISOString()
        : null,
      p_after_ok_id: afterOkId || null,

      p_limit_nok: limitNok,
      p_after_nok_created_at: afterNokAt
        ? new Date(afterNokAt).toISOString()
        : null,
      p_after_nok_id: afterNokId || null,

      p_month: month ?? null,
      p_year: year ?? null,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch data",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          detail: (error as any).message ?? error,
        },
        { status: 500 }
      );
    }

    // Data dari fungsi sudah final sesuai format baru: tanpa start_at/start_id/end_at/end_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = (data as any) || {};

    // Normalisasi supaya selalu ada 4 grup di bawah "data"
    const dataBlock =
      d.data && typeof d.data === "object"
        ? d.data
        : {
            needinput: d.needinput ?? [],
            inprogress: d.inprogress ?? [],
            ok: d.ok ?? [],
            nok: d.nok ?? [],
          };

    const ordered = {
      success: Boolean(d.success),
      scope: d.scope ?? (url.searchParams.get("scope") || "recent"),
      filters: d.filters ?? { month: null, year: null, search: null },
      data: {
        needinput: dataBlock.needinput ?? [],
        inprogress: dataBlock.inprogress ?? [],
        ok: dataBlock.ok ?? [],
        nok: dataBlock.nok ?? [],
      },
      pagination: d.pagination ?? {
        needinput: {
          limit: 9,
          cursor: {
            hasNextPage: false,
            hasPrevPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
        inprogress: {
          limit: 9,
          cursor: {
            hasNextPage: false,
            hasPrevPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
        ok: {
          limit: 9,
          cursor: {
            hasNextPage: false,
            hasPrevPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
        nok: {
          limit: 9,
          cursor: {
            hasNextPage: false,
            hasPrevPage: false,
            startCursor: null,
            endCursor: null,
          },
        },
      },
    };

    return NextResponse.json(ordered, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
