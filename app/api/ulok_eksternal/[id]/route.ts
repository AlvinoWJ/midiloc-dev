import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canUlokEksternal, POSITION } from "@/lib/auth/acl";

/**
 * @route GET /api/ulok_eksternal/[id]
 * @description Mengambil detail satu data Ulok Eksternal berdasarkan ID.
 * Melakukan validasi akses berdasarkan Role (RM/LM/LS).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canUlokEksternal("read", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const roleName = user.position_nama?.toLowerCase();

    // 2. Build Query
    let query = supabase
      .from("ulok_eksternal")
      .select("*, penanggungjawab(nama), branch_id(nama)")
      .eq("id", id)
      .limit(1);

    // 3. Apply Access Filters
    if (roleName === POSITION.LOCATION_SPECIALIST) {
      // LS: Hanya boleh lihat tugas yang ditugaskan kepadanya
      query = query.eq("penanggungjawab", user.id);
    } else if (roleName === POSITION.LOCATION_MANAGER) {
      // LM: Hanya boleh lihat data di cabangnya sendiri
      if (!user.branch_id)
        return NextResponse.json(
          { error: "Forbidden: No branch" },
          { status: 403 }
        );
      query = query.eq("branch_id", user.branch_id);
    }
    // RM & GM: Full Access (Filtered by ID only)

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error("[ULOK_EKS_DETAIL_DB]", error);
      return NextResponse.json({ error: "Database Error" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Data not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[ULOK_EKS_DETAIL_UNHANDLED]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
