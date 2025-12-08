import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canProgressKplt } from "@/lib/auth/acl";
import { PerizinanApprovalSchema } from "@/lib/validations/perizinan";
import { validateProgressAccess } from "@/utils/kpltProgressBranchChecker";

export const dynamic = "force-dynamic";

/**
 * @route PATCH /api/progress/[id]/perizinan/approval
 * @description Melakukan Approval (Selesai/Batal) pada Perizinan.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canProgressKplt("update", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!user.branch_id)
      return NextResponse.json(
        { error: "Forbidden: No branch" },
        { status: 403 }
      );

    // 2. Validate Access
    const check = await validateProgressAccess(supabase, user, params.id);
    if (!check.allowed)
      return NextResponse.json(
        { error: check.error },
        { status: check.status }
      );

    // 3. Parse Body
    const body = await req.json().catch(() => ({}));
    const parsed = PerizinanApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    // 4. Execute RPC
    const { data, error } = await supabase.rpc("fn_perizinan_approve", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: params.id,
      p_final_status: parsed.data.final_status_perizinan,
    });

    if (error) {
      const msg = (error.message || "").toLowerCase();

      // Handle Business Logic Errors
      if (msg.includes("already finalized"))
        return NextResponse.json(
          { error: "Already finalized", message: msg },
          { status: 409 }
        );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === "22P02")
        return NextResponse.json(
          { error: "Invalid Status Value" },
          { status: 422 }
        );

      console.error("[PERIZINAN_APPROVAL_RPC]", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[PERIZINAN_APPROVAL_PATCH_UNHANDLED]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
