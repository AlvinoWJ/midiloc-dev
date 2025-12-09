import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, InternalPositionName, POSITION } from "@/lib/auth/acl";
import { assignPICSchema } from "@/lib/validations/ulok_eksternal_workflow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * @route PATCH /api/ulok_eksternal/[id]/assign-penanggungjawab
 * @description Menetapkan Location Specialist (PIC) pada Ulok Eksternal.
 * Hanya bisa dilakukan oleh LM atau BM pada cabang yang sama.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  try {
    const { id } = await params;
    const me = await getCurrentUser();
    // 1. Auth & Role Check
    if (!me)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowedRoles = [POSITION.LOCATION_MANAGER];
    if (!allowedRoles.includes(me.position_nama as InternalPositionName)) {
      return NextResponse.json(
        { error: "Forbidden: Only LM can assign PIC" },
        { status: 403 }
      );
    }

    // 2. Validate Context (Branch Matching)
    // Pastikan Ulok Eksternal ini milik cabang user yang sedang login
    const { data: ulokMeta, error: metaErr } = await supabase
      .from("ulok_eksternal")
      .select("branch_id")
      .eq("id", id)
      .single();

    if (metaErr || !ulokMeta) {
      return NextResponse.json(
        { error: "Ulok Eksternal not found" },
        { status: 404 }
      );
    }

    // Strict Branch Check
    if (me.branch_id && ulokMeta.branch_id !== me.branch_id) {
      return NextResponse.json(
        { error: "Forbidden: Cross-branch assignment denied" },
        { status: 403 }
      );
    }

    // 3. Parse Body
    const body = await req.json().catch(() => null);
    const parsed = assignPICSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    // 4. Execute RPC

    const { penanggungjawab, description } = parsed.data;

    const { data, error } = await supabase.rpc(
      "fn_ulok_eksternal_assign_penanggungjawab",
      {
        p_actor_user_id: me.id,
        p_ulok_eksternal_id: id,
        p_new_penanggungjawab: penanggungjawab,
        p_description: description ?? null,
      }
    );

    if (error) {
      return NextResponse.json(
        { error: "Assign PIC Failed", detail: error.message },
        { status: 400 }
      );
    }

    // Check RPC logical error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rpcData = data as any;
    if (rpcData.success === false) {
      return NextResponse.json(
        { error: rpcData.error || "RPC Logic Error" },
        { status: 400 }
      );
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
