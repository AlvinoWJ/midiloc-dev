import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth/acl";
import { NotarisApprovalSchema } from "@/lib/validations/notaris";
import {
  checkAuthAndAccess,
  handleCommonError,
} from "@/lib/progress/api-helper";

export const dynamic = "force-dynamic";

/**
 * @route PATCH /api/progress/[id]/notaris/approval
 * @description Melakukan Approval (Selesai/Batal) pada tahap Notaris.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth Check (Permission: 'update')
    const authErr = await checkAuthAndAccess(supabase, user, id, "update");
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    // 2. Parse & Validate Body
    const body = await req.json().catch(() => ({}));
    const parsed = NotarisApprovalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    // 3. Execute Approval RPC
    const { data, error } = await supabase.rpc("fn_notaris_approve", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: id,
      p_final_status: parsed.data.final_status_notaris,
    });

    if (error) {
      // Handle Specific Business Logic Errors for Notaris
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("prerequisites not met")) {
        return NextResponse.json(
          {
            error: "Precondition Failed",
            message: "Syarat belum terpenuhi (Cek Perizinan/Validasi Legal)",
          },
          { status: 422 }
        );
      }

      // Fallback to common error handler
      return handleCommonError(error, "NOTARIS_APPROVAL");
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return handleCommonError(err, "NOTARIS_APPROVAL_UNHANDLED");
  }
}
