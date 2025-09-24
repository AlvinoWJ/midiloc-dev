import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser,  canKplt } from "@/lib/auth/acl";

type ViewMode = "all" | "ulok_ok" | "existing";

export async function GET(request: Request) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canKplt("read", user)) {
    return NextResponse.json(
      { error: "Forbidden", message: "Access denied" },
      { status: 403 }
    );
  }
  if (!user.branch_id) {
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const viewParam = (searchParams.get("view") ?? "all").toLowerCase();
  const view: ViewMode = (["all", "ulok_ok", "existing"] as const).includes(
    viewParam as ViewMode
  )
    ? (viewParam as ViewMode)
    : "all";

  // 1 panggilan RPC saja
  const { data, error } = await supabase.rpc("fn_kplt_dashboard", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_position: String(user.position_nama ?? "").toLowerCase(),
    p_view: view,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch data", detail: error.message ?? error },
      { status: 500 }
    );
  }

  // data sudah berbentuk payload JSON dari DB
  return NextResponse.json(
    data ?? {
      kplt_from_ulok_ok: [],
      kplt_existing: [],
      meta: { kplt_from_ulok_ok_count: 0, kplt_existing_count: 0 },
    },
    { status: 200 }
  );
}
