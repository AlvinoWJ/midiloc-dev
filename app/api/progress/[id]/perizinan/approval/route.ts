import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import { PerizinanApprovalSchema } from "@/lib/validations/perizinan";

// PATCH /api/progress/[id]/perizinan/approval
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("update", user))
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
  const parsed = PerizinanApprovalSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Validation failed", detail: parsed.error.issues },
      { status: 422 }
    );

  const { data, error } = await supabase.rpc("fn_perizinan_approve", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
    p_final_status: parsed.data.final_status_perizinan, // "selesai" | "batal"
  });

  if (error) {
    type SupabaseError = { message?: string; code?: string };
    const supabaseError = error as SupabaseError;
    const msg = supabaseError?.message?.toLowerCase() || "";
    const isAlready = msg.includes("already finalized");
    const isInvalid = supabaseError?.code === "22P02";
    return NextResponse.json(
      {
        error: isAlready
          ? "Perizinan already finalized"
          : isInvalid
          ? "Invalid status"
          : "Failed to approve perizinan",
        detail: supabaseError?.message ?? error,
      },
      { status: isAlready ? 409 : isInvalid ? 422 : 500 }
    );
  }

  return NextResponse.json({ data }, { status: 200 });
}
