/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canUlokEksisting } from "@/lib/auth/acl";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!params.id) {
      return NextResponse.json(
        { success: false, error: "Missing progress_kplt_id" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("fn_ulok_eksisting_detail", {
      p_actor_user_id: user.id,
      p_progress_kplt_id: params.id,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message ?? String(error) },
        { status: 500 }
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { success: false, error: "Unexpected RPC response" },
        { status: 500 }
      );
    }

    if ((data as any).success === false) {
      return NextResponse.json(data, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
