import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import {
  KpltIdParamSchema,
  KpltApprovalPostSchema,
  KpltStatusPatchSchema,
} from "@/lib/validations/kplt-approval";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * @route POST /api/kplt/[id]/approvals
 * @description Submit approval untuk level Branch Manager (BM) atau Regional Manager (RM).
 * Menggunakan RPC `fn_kplt_approval_submit`.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canKplt("approve", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!user.branch_id)
      return NextResponse.json(
        { error: "Forbidden", message: "User has no branch" },
        { status: 403 }
      );

    // 2. Validation
    const p = KpltIdParamSchema.safeParse({ id });
    if (!p.success)
      return NextResponse.json(
        { error: "Invalid id", detail: p.error.issues },
        { status: 422 }
      );

    const body = await req.json().catch(() => null);
    const b = KpltApprovalPostSchema.safeParse(body);
    if (!b.success)
      return NextResponse.json(
        { error: "Validation failed", detail: b.error.issues },
        { status: 422 }
      );

    // 3. Execute RPC
    const { data, error } = await supabase.rpc("fn_kplt_approval_submit", {
      p_user_id: user.id,
      p_branch_id: user.branch_id,
      p_position: String(user.position_nama ?? "").toLowerCase(),
      p_kplt_id: p.data.id,
      p_is_approved: b.data.is_approved,
    });

    if (error) {
      console.error("[KPLT_APPROVAL_POST]", error);
      return NextResponse.json(
        { error: "Approval submit failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[KPLT_APPROVAL_POST] Unhandled:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * @route PATCH /api/kplt/[id]/approvals
 * @description Mengubah status final KPLT (Khusus General Manager).
 * Menggunakan RPC `fn_kplt_set_status`.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth Check
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!canKplt("final-approve", user))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!user.branch_id)
      return NextResponse.json(
        { error: "Forbidden", message: "User has no branch" },
        { status: 403 }
      );

    // 2. Validation
    const p = KpltIdParamSchema.safeParse({ id });
    if (!p.success)
      return NextResponse.json(
        { error: "Invalid id", detail: p.error.issues },
        { status: 422 }
      );

    const body = await req.json().catch(() => null);
    const b = KpltStatusPatchSchema.safeParse(body);
    if (!b.success)
      return NextResponse.json(
        { error: "Validation failed", detail: b.error.issues },
        { status: 422 }
      );

    // 3. Execute RPC
    const { data, error } = await supabase.rpc("fn_kplt_set_status", {
      p_user_id: user.id,
      p_kplt_id: p.data.id,
      p_new_status: b.data.kplt_approval,
    });

    if (error) {
      console.error("[KPLT_APPROVAL_PATCH]", error);
      return NextResponse.json({ error: "Set status failed" }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.error("[KPLT_APPROVAL_PATCH] Unhandled:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
