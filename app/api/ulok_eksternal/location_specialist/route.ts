import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, POSITION } from "@/lib/auth/acl";

/**
 * @route GET /api/ulok_eksternal/location_specialist
 * @description Mengambil daftar Location Specialist (LS) di cabang user yang login.
 * Khusus untuk LM dan BM.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const me = await getCurrentUser();
  // 1. Auth & Role Check
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowedRoles = [POSITION.LOCATION_MANAGER];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!allowedRoles.includes(me.position_nama as any)) {
    return NextResponse.json(
      { error: "Forbidden: Only LM/BM can access this list" },
      { status: 403 }
    );
  }

  if (!me.branch_id) {
    return NextResponse.json(
      { error: "Forbidden: User has no branch" },
      { status: 403 }
    );
  }

  // 2. Pagination Params
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.max(
    1,
    Math.min(200, Number(url.searchParams.get("limit") || "50"))
  );
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // 3. Resolve Position ID for 'Location Specialist'
  const { data: pos, error: posErr } = await supabase
    .from("position")
    .select("id, nama")
    .ilike("nama", "location specialist")
    .maybeSingle();

  if (posErr || !pos?.id) {
    return NextResponse.json(
      {
        error: "Position 'Location Specialist' not found",
        detail: posErr?.message,
      },
      { status: 500 }
    );
  }

  // 4. Query Users
  const { data, error, count } = await supabase
    .from("users")
    .select("id, nama, email, is_active, branch_id, position_id", {
      count: "exact",
    })
    .eq("branch_id", me.branch_id) // Filter by user's branch
    .eq("position_id", pos.id) // Filter only LS
    .eq("is_active", true)
    .order("nama", { ascending: true })
    .range(from, to);

  if (error) {
    return NextResponse.json(
      { error: "Failed to load location specialists", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      meta: { page, limit, total: count ?? 0, branch_id: me.branch_id },
      items: data ?? [],
    },
    { status: 200 }
  );
}
