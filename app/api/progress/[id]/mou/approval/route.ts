import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canProgressKplt } from "@/lib/auth/acl";
import { MouApprovalSchema } from "@/lib/validations/mou";
import { validateProgressAccess } from "@/utils/kpltProgressBranchChecker";

export const dynamic = "force-dynamic";

/**
 * @route PATCH /api/progress/[id]/mou/approval
 * @description Approves or Rejects the MOU (Memorandum of Understanding) step.
 * Access: User with 'update' permission on progress_kplt.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth & Permission Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canProgressKplt("update", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!user.branch_id)
      return NextResponse.json(
        { error: "Forbidden: No branch" },
        { status: 403 }
      );

    // 2. Validate Access to Progress ID
    const check = await validateProgressAccess(supabase, user, id);
    if (!check.allowed)
      return NextResponse.json(
        { error: check.error },
        { status: check.status }
      );

    // 3. Parse & Validate Body
    const progressId = id;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object")
      return NextResponse.json(
        { error: "Bad Request: Invalid JSON body" },
        { status: 400 }
      );
    const parsed = MouApprovalSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );

    const { final_status_mou } = parsed.data;

    // 4. Execute Approval RPC
    const { data, error } = await supabase.rpc("fn_mou_approve", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_progress_kplt_id: progressId,
      p_final_status: final_status_mou,
    });

    if (error) {
      // Handle known business logic errors
      const msg = error.message;
      if (msg?.includes("already finalized"))
        return NextResponse.json(
          { success: false, error: "Conflict", message: msg },
          { status: 409 }
        );
      if (msg?.includes("incomplete"))
        return NextResponse.json(
          { success: false, error: "Unprocessable Entity", message: msg },
          { status: 422 }
        );
      if (msg?.includes("not found"))
        return NextResponse.json(
          { success: false, error: "Not Found", message: msg },
          { status: 404 }
        );
      // Log unknown errors and return generic message
      console.error("[MOU_APPROVAL_RPC]", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ...data }, { status: 200 });
  } catch (err) {
    console.error("[MOU_APPROVAL_PATCH] Unhandled:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
