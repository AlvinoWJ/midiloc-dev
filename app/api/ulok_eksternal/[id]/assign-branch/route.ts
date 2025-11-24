import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assignBranchSchema } from "@/lib/validations/ulok_eksternal_workflow";
import { getCurrentUser, POSITION } from "@/lib/auth/acl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const me = await getCurrentUser();
    if (!me)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (me.position_nama !== POSITION.REGIONAL_MANAGER) {
      return NextResponse.json(
        {
          error: "Forbidden: hanya Regional Manager yang dapat memilih branch",
        },
        { status: 403 }
      );
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Body harus JSON" }, { status: 400 });
    }

    const parsed = assignBranchSchema.safeParse(json);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
      return NextResponse.json({ success: false, error: msg }, { status: 422 });
    }

    if (!params.id) {
      return NextResponse.json(
        { success: false, error: "Missing ulok_eksternal id in route" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Panggil RPC
    const { data, error } = await supabase.rpc(
      "fn_ulok_eksternal_assign_branch",
      {
        p_actor_user_id: me.id,
        p_ulok_eksternal_id: params.id,
        p_new_branch_id: parsed.data.branch_id,
      }
    );

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message ?? String(error) },
        { status: 400 }
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        { success: false, error: "Unexpected RPC response" },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((data as any).success === false) {
      return NextResponse.json(data, { status: 400 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
