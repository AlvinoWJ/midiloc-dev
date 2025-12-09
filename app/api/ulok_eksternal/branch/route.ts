import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, POSITION } from "@/lib/auth/acl";

/**
 * @route GET /api/ulok_eksternal/branch
 * @description Mengambil daftar branch aktif. Khusus Regional Manager.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const me = await getCurrentUser();

  // 1. Auth & Role Check
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.position_nama !== POSITION.REGIONAL_MANAGER) {
    return NextResponse.json(
      { error: "Forbidden: Only RM can access this list" },
      { status: 403 }
    );
  }

  // 2. Pagination & Filter Params
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.max(
    1,
    Math.min(200, Number(url.searchParams.get("limit") || "50"))
  );
  const onlyActive = (url.searchParams.get("active") ?? "1") === "1"; // default hanya aktif
  const region = url.searchParams.get("region"); // optional region_code filter
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // 3. Query
  let query = supabase.from("branch").select("*", { count: "exact" });
  if (onlyActive) query = query.eq("is_active", true);
  if (region) {
    const regionNum = Number(region);
    if (Number.isFinite(regionNum)) query = query.eq("region_code", regionNum);
  }

  query = query.order("nama", { ascending: true }).range(from, to);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Failed to load branches", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      meta: {
        page,
        limit,
        total: count ?? 0,
        active: onlyActive ? "1" : "0",
        region: region ?? undefined,
      },
      items: data ?? [],
    },
    { status: 200 }
  );
}
