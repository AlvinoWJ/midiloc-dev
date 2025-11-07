import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { approveSchema } from "@/lib/validations/ulok_eksternal_workflow";
import { getCurrentUser, POSITION } from "@/lib/auth/acl";

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

    if (me.position_nama !== POSITION.LOCATION_SPECIALIST) {
      return NextResponse.json(
        {
          error:
            "Forbidden: hanya Location Specialist yang dapat melakukan approval",
        },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Ambil ulok_eksternal untuk validasi kepemilikan tugas
    const { data: ulokEks, error: findErr } = await supabase
      .from("ulok_eksternal")
      .select("id, branch_id, penanggungjawab, status_ulok_eksternal")
      .eq("id", params.id)
      .maybeSingle();

    if (findErr)
      return NextResponse.json({ error: findErr.message }, { status: 400 });
    if (!ulokEks)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!ulokEks.penanggungjawab) {
      return NextResponse.json(
        { error: "Penanggungjawab belum ditetapkan" },
        { status: 409 }
      );
    }

    if (ulokEks.penanggungjawab !== me.id) {
      return NextResponse.json(
        { error: "Forbidden: Anda bukan penanggungjawab ulok ini" },
        { status: 403 }
      );
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "Body harus JSON" }, { status: 400 });
    }

    const parsed = approveSchema.safeParse(json);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return NextResponse.json({ error: msg }, { status: 422 });
    }

    const nextStatus = parsed.data.status_ulok_eksternal;

    // Jika OK, pastikan prasyarat lengkap (DB juga enforce via CHECK, ini validasi dini)
    if (nextStatus === "OK") {
      if (!ulokEks.branch_id) {
        return NextResponse.json(
          { error: "Branch belum ditetapkan" },
          { status: 409 }
        );
      }
    }

    // Update status (BEFORE trigger akan set approved_at saat menuju OK,
    // AFTER trigger akan buat ulok jika OK)
    const { data, error } = await supabase
      .from("ulok_eksternal")
      .update({
        status_ulok_eksternal: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select("*")
      .single();

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });

    // Jika OK, coba ambil ulok yang terbentuk untuk dikembalikan id-nya
    let ulokCreated: { id: string } | null = null;
    if (nextStatus === "OK") {
      const { data: u, error: uErr } = await supabase
        .from("ulok")
        .select("id")
        .eq("ulok_eksternal_id", params.id)
        .maybeSingle();
      if (!uErr && u) {
        ulokCreated = u;
      }
    }

    return NextResponse.json({ data, ulok: ulokCreated });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
