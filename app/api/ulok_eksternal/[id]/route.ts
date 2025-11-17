/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canUlokEksternal } from "@/lib/auth/acl";

function roleFromPositionName(
  name?: string | null
): "rm" | "bm" | "lm" | "ls" | undefined {
  if (!name) return undefined;
  const key = name.trim().toLowerCase();
  if (key === "regional manager") return "rm";
  if (key === "branch manager") return "bm";
  if (key === "location manager") return "lm";
  if (key === "location specialist") return "ls";
  return undefined;
}

// GET /api/ulok-eksternal/:id
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canUlokEksternal("read", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const positionName =
      (user as any)?.position_nama ??
      (user as any)?.position?.nama ??
      (user as any)?.positionName ??
      null;

    const role = roleFromPositionName(positionName);
    if (!role) {
      return NextResponse.json(
        { error: `Unsupported position '${positionName ?? "-"}'` },
        { status: 403 }
      );
    }

    const { id } = params;

    let query = supabase
      .from("ulok_eksternal")
      .select("*, penanggungjawab(nama), branch_id(nama)")
      .eq("id", id)
      .limit(1);

    // Terapkan filter akses sesuai role:
    if (role === "ls") {
      // LS: hanya boleh akses jika dia penanggungjawab-nya
      query = query.eq("penanggungjawab", user.id);
    } else if (role === "bm" || role === "lm") {
      // BM/LM: hanya boleh akses data di branch-nya
      if (!(user as any)?.branch_id) {
        return NextResponse.json(
          { error: "Forbidden: user has no branch" },
          { status: 403 }
        );
      }
      query = query.eq("branch_id", user.branch_id);
    } else {
      // RM: boleh akses semua
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: row }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? err?.message ?? String(err)
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}
