import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canUlok } from "@/lib/auth/acl";

export const dynamic = "force-dynamic";

const UlokIdSchema = z.string().trim().uuid();

/**
 * @route GET /api/kplt/prefill
 * @description Mengambil data awal (prefill) dari ULOK untuk form KPLT.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    // 1. Auth Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // Menggunakan permission 'read' ULOK karena data bersumber dari ULOK
    if (!canUlok("read", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 2. Input Validation
    const rawParam = req.nextUrl.searchParams.get("ulok_id") ?? "";
    const parsed = UlokIdSchema.safeParse(rawParam);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid ulok_id format",
          detail: parsed.error.issues,
        },
        { status: 422 }
      );
    }

    const ulokId = parsed.data;
    const supabase = await createClient();

    // 3. Execute RPC
    const { data, error } = await supabase.rpc("fn_kplt_prefill", {
      p_ulok_id: ulokId,
    });

    if (error) {
      console.error("[KPLT_PREFILL_RPC]", error);
      return NextResponse.json(
        { error: "Failed to fetch prefill data" },
        { status: 500 }
      );
    }

    if (!data || !data.base) {
      return NextResponse.json(
        { error: "ULOK not found or not eligible for KPLT", ulok_id: ulokId },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[KPLT_PREFILL_UNHANDLED]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
