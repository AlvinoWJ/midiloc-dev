/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canUlokEksisting } from "@/lib/auth/acl";

/**
 * @route GET /api/ulok_eksisting/[id]
 * @description Mengambil detail data Ulok Eksisting (Toko Buka).
 * ID yang digunakan adalah `progress_kplt_id`.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // 2. Validate Input
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing progress_kplt_id" },
        { status: 400 }
      );
    }

    // 3. Execute RPC
    const { data, error } = await supabase.rpc("fn_ulok_eksisting_detail", {
      p_actor_user_id: user.id,
      p_progress_kplt_id: id,
    });

    if (error) {
      console.error("[ULOK_EKSISTING_DETAIL_RPC]", error);
      return NextResponse.json({ error: "Database Error" }, { status: 500 });
    }

    const result = data as any;

    // Handle Application-level Error from RPC
    if (result?.success === false) {
      return NextResponse.json(
        { error: result.error || "Data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[ULOK_EKSISTING_DETAIL_UNHANDLED]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
