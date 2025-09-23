// /* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
// import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser, canKplt } from "@/lib/auth/acl";
import { KpltIdParamSchema } from "@/lib/validations/kplt-approval";
import {
  KpltApprovalPostSchema,
  KpltStatusPatchSchema,
} from "@/lib/validations/kplt-approval";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const parsed = KpltIdParamSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid id", detail: parsed.error.issues },
      { status: 422 }
    );
  }

  const { data, error } = await supabase.rpc("fn_kplt_detail", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_position: String(user.position_nama ?? "").toLowerCase(),
    p_kplt_id: parsed.data.id,
  });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch KPLT detail", detail: error.message ?? error },
      { status: 500 }
    );
  }
  if (!data) return NextResponse.json({ error: "Not Found" }, { status: 404 });

  return NextResponse.json(data, { status: 200 });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("update", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const p = KpltIdParamSchema.safeParse(params);
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

  const { data, error } = await supabase.rpc("fn_kplt_approval_submit", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_position: String(user.position_nama ?? "").toLowerCase(),
    p_kplt_id: p.data.id,
    p_is_approved: b.data.is_approved,
  });

  if (error) {
    return NextResponse.json(
      { error: "Approval submit failed", detail: error.message ?? error },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 200 });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canKplt("update", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );

  const p = KpltIdParamSchema.safeParse(params);
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

  const { data, error } = await supabase.rpc("fn_kplt_set_status", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_position: String(user.position_nama ?? "").toLowerCase(),
    p_kplt_id: p.data.id,
    p_new_status: b.data.approval_status,
  });

  if (error) {
    return NextResponse.json(
      { error: "Set status failed", detail: error.message ?? error },
      { status: 500 }
    );
  }

  return NextResponse.json({ data }, { status: 200 });
}
