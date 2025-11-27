import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canProgressKplt } from "@/lib/auth/acl";
import { validateProgressAccess } from "@/utils/kpltProgressBranchChecker";

// GET /api/progress/[id]/renovasi/history
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canProgressKplt("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
  const check = await validateProgressAccess(supabase, user, params.id);
  if (!check.allowed)
    return NextResponse.json({ error: check.error }, { status: check.status });

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  const { data, error } = await supabase.rpc("fn_renovasi_history_list", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
  });

  type SupabaseError = {
    code?: string;
    message?: string;
    [key: string]: unknown;
  };

  if (error) {
    const supabaseError = error as unknown as SupabaseError;
    const status = supabaseError.code === "22023" ? 404 : 500;
    return NextResponse.json(
      {
        error: "Failed to load renovasi history",
        detail: supabaseError.message ?? error,
      },
      { status }
    );
  }

  // data: { count, items: [{ id, created_at, data }] }
  return NextResponse.json({ data }, { status: 200 });
}
