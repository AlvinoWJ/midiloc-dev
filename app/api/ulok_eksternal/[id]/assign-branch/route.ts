import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assignBranchSchema } from "@/lib/validations/ulok_eksternal_workflow";
import { getCurrentUser, POSITION } from "@/lib/auth/acl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * @route PATCH /api/ulok_eksternal/[id]/assign-branch
 * @description Menetapkan Branch pada Ulok Eksternal.
 * Hanya bisa dilakukan oleh Regional Manager (RM).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const me = await getCurrentUser();
    // 1. Auth & Role Check
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

    // 2. Validate Param ID
    if (!id) {
      return NextResponse.json(
        { error: "Missing ulok_eksternal id" },
        { status: 400 }
      );
    }

    // 3. Parse Body
    const json = await req.json().catch(() => null);
    const parsed = assignBranchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    const supabase = await createClient();

    // 4. Execute RPC
    const { data, error } = await supabase.rpc(
      "fn_ulok_eksternal_assign_branch",
      {
        p_actor_user_id: me.id,
        p_ulok_eksternal_id: id,
        p_new_branch_id: parsed.data.branch_id,
      }
    );

    // 5. Handle RPC Errors
    if (error) {
      return NextResponse.json(
        { error: "Assign Branch Failed", detail: error.message },
        { status: 400 }
      );
    }

    // Check application-level success flag from RPC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((data as any)?.success === false) {
      return NextResponse.json(data, { status: 400 });
    }

    return NextResponse.json(data, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return NextResponse.json(
      { error: "Internal Server Error", detail: e.message },
      { status: 500 }
    );
  }
}
