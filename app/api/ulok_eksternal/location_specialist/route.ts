import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/acl";

function roleSlug(posName?: string | null): "bm" | "lm" | "other" {
  const key = (posName || "").trim().toLowerCase();
  if (key === "branch manager") return "bm";
  if (key === "location manager") return "lm";
  return "other";
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myBranchId = me.branch_id as string | undefined;
  const myPositionName = me.position_nama as string | undefined;

  const role = roleSlug(myPositionName);
  if (role === "other") {
    return NextResponse.json(
      {
        error: "Forbidden",
        message: "Only Branch/Location Manager can list Location Specialists",
      },
      { status: 403 }
    );
  }
  if (!myBranchId) {
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
  }

  // Pagination (tanpa pencarian)
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const limit = Math.max(
    1,
    Math.min(200, Number(url.searchParams.get("limit") || "50"))
  );
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Ambil position_id untuk "Location Specialist" (case-insensitive) sekali
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

  const query = supabase
    .from("users")
    .select("id, nama, email, is_active, branch_id, position_id", {
      count: "exact",
    })
    .eq("branch_id", myBranchId)
    .eq("position_id", pos.id)
    .eq("is_active", true)
    .order("nama", { ascending: true })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Failed to load location specialists", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      meta: { page, limit, total: count ?? 0, branch_id: myBranchId },
      items: data ?? [],
    },
    { status: 200 }
  );
}
