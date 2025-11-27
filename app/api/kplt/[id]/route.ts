import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import { KpltIdParamSchema } from "@/lib/validations/kplt-approval";

export const dynamic = "force-dynamic";
export const revalidate = 0;
  
// detail kplt
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id) {
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
  }

  const parsed = KpltIdParamSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid id", detail: parsed.error.issues },
      { status: 422 }
    );
  }

  const { data, error } = await supabase.rpc("fn_kplt_detail", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_kplt_id: parsed.data.id,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch KPLT detail", detail: error.message ?? error },
      { status: 500 }
    );
  }
  if (!data) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  return NextResponse.json(data, { status: 200 });
}
