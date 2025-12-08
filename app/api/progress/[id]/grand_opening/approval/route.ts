import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/acl";
import { GOApprovalSchema } from "@/lib/validations/grand_opening";
import {
  checkAuthAndAccess,
  handleCommonError,
} from "@/lib/progress/api-helper";

export const dynamic = "force-dynamic";

/**
 * @route PATCH /api/progress/[id]/grand_opening/approval
 * @description Melakukan Approval (Selesai/Batal) pada Grand Opening.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth Check
    const authErr = await checkAuthAndAccess(supabase, user, id, "update");
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const parsed = GOApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    // 3. Execute RPC
    const { data, error } = await supabase.rpc("fn_go_approve", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
      p_final_status: parsed.data.final_status_go, // "selesai" | "batal"
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();
      // Handle Specific Business Logic Errors
      if (msg.includes("prerequisite") || msg.includes("renovasi")) {
        return NextResponse.json(
          {
            error: "Precondition Failed",
            message: "Syarat Renovasi belum terpenuhi",
          },
          { status: 422 }
        );
      }
      return handleCommonError(error, "GO_APPROVAL");
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return handleCommonError(err, "GO_APPROVAL_UNHANDLED");
  }
}
