import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { approveSchema } from "@/lib/validations/ulok_eksternal_workflow";
import { getCurrentUser, POSITION } from "@/lib/auth/acl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * @route PATCH /api/ulok_eksternal/[id]/approval
 * @description Melakukan approval pada Ulok Eksternal. Hanya untuk LS.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const me = await getCurrentUser();
    if (!me)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Role Check: Hanya LS
    if (me.position_nama?.toLowerCase() !== POSITION.LOCATION_SPECIALIST) {
      return NextResponse.json(
        { error: "Forbidden: Only LS can approve" },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // 1. Validate Ownership
    const { data: ulokEks, error: findErr } = await supabase
      .from("ulok_eksternal")
      .select("id, branch_id, penanggungjawab, status_ulok_eksternal")
      .eq("id", id)
      .maybeSingle();
    if (findErr)
      return NextResponse.json({ error: "Database Error" }, { status: 500 });
    if (!ulokEks)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (ulokEks.penanggungjawab !== me.id) {
      return NextResponse.json(
        { error: "Forbidden: Not assigned to you" },
        { status: 403 }
      );
    }

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const parsed = approveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    const nextStatus = parsed.data.status_ulok_eksternal; // "OK" | "NOK"

    // 3. Pre-condition Check
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
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("[ULOK_EKS_APPROVE_DB]", error);
      return NextResponse.json({ error: "Approval failed" }, { status: 500 });
    }

    // 5. Fetch Created Ulok (If Approved)
    let ulokCreated = null;
    if (nextStatus === "OK") {
      const { data: u } = await supabase
        .from("ulok")
        .select("id")
        .eq("ulok_eksternal_id", id)
        .maybeSingle();
      ulokCreated = u;
    }

    return NextResponse.json({ data, ulok: ulokCreated });
  } catch (err) {
    console.error("[ULOK_EKS_APPROVE_UNHANDLED]", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
