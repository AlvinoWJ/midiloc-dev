import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/acl";
import { RenovasiApprovalSchema } from "@/lib/validations/renovasi";
import {
  checkAuthAndAccess,
  handleCommonError,
} from "@/lib/progress/api-helper";

export const dynamic = "force-dynamic";

/**
 * @route PATCH /api/progress/[id]/renovasi/approval
 * @description Melakukan Approval (Selesai/Batal) pada Renovasi.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  try {
    const user = await getCurrentUser();
    // 1. Auth Check
    const authErr = await checkAuthAndAccess(
      supabase,
      user,
      params.id,
      "update"
    );
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const parsed = RenovasiApprovalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    //3.Execute RPC
    const { data, error } = await supabase.rpc("fn_renovasi_approve", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: params.id,
      p_final_status: parsed.data.final_status_renov, // "selesai" | "batal"
    });

    if (error) {
      // Handle Specific Business Logic Errors
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("prerequisite")) {
        return NextResponse.json(
          {
            error: "Precondition Failed",
            message: "Syarat Notaris belum terpenuhi",
          },
          { status: 422 }
        );
      }
      return handleCommonError(error, "RENOVASI_APPROVAL");
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return handleCommonError(err, "RENOVASI_APPROVAL_UNHANDLED");
  }
}
