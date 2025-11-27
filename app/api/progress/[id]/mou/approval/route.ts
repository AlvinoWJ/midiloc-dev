/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canProgressKplt } from "@/lib/auth/acl";
import { MouApprovalSchema } from "@/lib/validations/mou";
import { validateProgressAccess } from "@/utils/kpltProgressBranchChecker";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  if (!canProgressKplt("update", user))
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  if (!user.branch_id)
    return NextResponse.json(
      { success: false, error: "Forbidden", message: "No branch" },
      { status: 403 }
    );
  const check = await validateProgressAccess(supabase, user, params.id);
  if (!check.allowed)
    return NextResponse.json({ error: check.error }, { status: check.status });

  const progressId = params.id;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json(
      { success: false, error: "Bad Request" },
      { status: 400 }
    );

  const parsed = MouApprovalSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        detail: parsed.error.issues,
      },
      { status: 422 }
    );

  const { final_status_mou } = parsed.data;

  const { data, error } = await supabase.rpc("fn_mou_approve", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
    p_final_status: final_status_mou,
  });

  if (error) {
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
    return NextResponse.json(
      { success: false, error: "RPC Error", detail: msg },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, ...(data as any) },
    { status: 200 }
  );
}
