import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assignBranchSchema } from "@/lib/validations/ulok_eksternal_workflow";
import { getCurrentUser,POSITION } from "@/lib/auth/acl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const me = await getCurrentUser();
    if (!me)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (me.position_nama !== POSITION.REGIONAL_MANAGER) {
      return NextResponse.json(
        {
          error: "Forbidden: hanya Regional Manager yang dapat memilih branch",
        },
        { status: 403 }
      );
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Body harus JSON" }, { status: 400 });
    }

    const parsed = assignBranchSchema.safeParse(json);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return NextResponse.json({ error: msg }, { status: 422 });
    }

    const supabase = await createClient();

    // Pastikan ulok_eksternal ada
    const { data: ulokEks, error: findErr } = await supabase
      .from("ulok_eksternal")
      .select("id")
      .eq("id", params.id)
      .maybeSingle();
    if (findErr)
      return NextResponse.json({ error: findErr.message }, { status: 400 });
    if (!ulokEks)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Validasi branch ada dan aktif (jika ada kolom is_active)
    const { data: branch, error: bErr } = await supabase
      .from("branch")
      .select("id, is_active")
      .eq("id", parsed.data.branch_id)
      .maybeSingle();
    if (bErr)
      return NextResponse.json({ error: bErr.message }, { status: 400 });
    if (!branch)
      return NextResponse.json(
        { error: "Branch tidak ditemukan" },
        { status: 404 }
      );
    if (branch.is_active === false)
      return NextResponse.json(
        { error: "Branch tidak aktif" },
        { status: 409 }
      );

    const { data, error } = await supabase
      .from("ulok_eksternal")
      .update({
        branch_id: parsed.data.branch_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select("*")
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ data });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: (e instanceof Error ? e.message : "Unknown error") },
      { status: 500 }
    );
  }
}
