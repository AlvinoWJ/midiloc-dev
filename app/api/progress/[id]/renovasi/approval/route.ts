import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canProgressKplt } from "@/lib/auth/acl";
import { RenovasiApprovalSchema } from "@/lib/validations/renovasi";

// PATCH /api/progress/[id]/renovasi/approval
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canProgressKplt("update", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  const body = await req.json().catch(() => ({}));
  const parsed = RenovasiApprovalSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Validation failed", detail: parsed.error.issues },
      { status: 422 }
    );

  const { data, error } = await supabase.rpc("fn_renovasi_approve", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
    p_final_status: parsed.data.final_status_renov, // "selesai" | "batal"
  });

  if (error) {
    type SupabaseError = { message?: string; code?: string };
    const errObj = error as SupabaseError;
    const msg = errObj?.message?.toLowerCase() || "";
    const isAlready = msg.includes("already finalized");
    const isInvalid = errObj?.code === "22P02";
    const isMissing = msg.includes("required fields");
    const isPrereq = msg.includes("prerequisite");
    return NextResponse.json(
      {
        error: isAlready
          ? "Renovasi already finalized"
          : isInvalid
          ? "Invalid status"
          : isMissing
          ? "Required fields missing"
          : isPrereq
          ? "Prerequisite Notaris not met"
          : "Failed to approve Renovasi",
        detail: errObj?.message ?? error,
      },
      {
        status: isAlready
          ? 409
          : isInvalid
          ? 422
          : isMissing || isPrereq
          ? 422
          : 500,
      }
    );
  }

  return NextResponse.json({ data }, { status: 200 });
}
