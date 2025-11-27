/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canProgressKplt } from "@/lib/auth/acl";
import {
  GOCreateSchema,
  GOUpdateSchema,
  stripServerControlledFieldsGO,
} from "@/lib/validations/grand_opening";
import { validateProgressAccess } from "@/utils/kpltProgressBranchChecker";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      {
        success: false,
        error: "Forbidden",
        message: "Anda tidak berhak melakukan aksi ini",
      },
      { status: 401 }
    );
  if (!canProgressKplt("read", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
  const check = await validateProgressAccess(supabase, user, params.id);
  if (!check.allowed)
    return NextResponse.json({ error: check.error }, { status: check.status });

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  const { data, error } = await supabase.rpc("fn_go_get", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
  });

  if (error) {
    const status = (error as any)?.code === "22023" ? 404 : 500;
    return NextResponse.json(
      { error: "Failed to load GrandOpening", detail: error.message ?? error },
      { status }
    );
  }
  if (!data)
    return NextResponse.json(
      { error: "GrandOpening not found" },
      { status: 404 }
    );
  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canProgressKplt("create", user) && !canProgressKplt("update", user))
    return NextResponse.json(
      {
        success: false,
        error: "Forbidden",
        message: "Anda tidak berhak melakukan aksi ini",
      },
      { status: 403 }
    );
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
    const check = await validateProgressAccess(supabase, user, params.id);
  if (!check.allowed)
    return NextResponse.json({ error: check.error }, { status: check.status });

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  const body = await req.json().catch(() => ({}));
  if (
    "id" in body ||
    "progress_kplt_id" in body ||
    "final_status_go" in body ||
    "created_at" in body ||
    "updated_at" in body ||
    "tgl_selesai_go" in body
  ) {
    return NextResponse.json(
      { error: "Invalid payload: server-controlled fields present" },
      { status: 400 }
    );
  }

  const parsed = GOCreateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Validation failed", detail: parsed.error.issues },
      { status: 422 }
    );

  const payload = stripServerControlledFieldsGO(parsed.data);

  const { data, error } = await supabase.rpc("fn_go_create", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
    p_payload: payload,
  });

  if (error) {
    const msg = (error as any)?.message?.toLowerCase() || "";
    const isPrereq =
      msg.includes("prerequisite invalid") || msg.includes("renovasi");
    if ((error as any)?.code === "23505")
      return NextResponse.json(
        { error: "GrandOpening already exists for this progress" },
        { status: 409 }
      );
    return NextResponse.json(
      {
        error: isPrereq
          ? "Prerequisite Renovasi not met"
          : "Failed to create GrandOpening",
        detail: (error as any)?.message ?? error,
      },
      { status: isPrereq ? 422 : 500 }
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}

// PATCH /api/progress/[id]/grand-opening
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canProgressKplt("update", user))
    return NextResponse.json(
      {
        success: false,
        error: "Forbidden",
        message: "Anda tidak berhak melakukan aksi ini",
      },
      { status: 403 }
    );
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
    const check = await validateProgressAccess(supabase, user, params.id);
  if (!check.allowed)
    return NextResponse.json({ error: check.error }, { status: check.status });

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  const body = await req.json().catch(() => ({}));
  if (
    "id" in body ||
    "progress_kplt_id" in body ||
    "final_status_go" in body ||
    "created_at" in body ||
    "updated_at" in body ||
    "tgl_selesai_go" in body
  ) {
    return NextResponse.json(
      { error: "Invalid payload: server-controlled fields present" },
      { status: 400 }
    );
  }

  const parsed = GOUpdateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Validation failed", detail: parsed.error.issues },
      { status: 422 }
    );

  const payload = stripServerControlledFieldsGO(parsed.data);

  const { data, error } = await supabase.rpc("fn_go_update", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
    p_payload: payload,
  });

  if (error) {
    const status = (error as any)?.code === "22023" ? 409 : 500;
    return NextResponse.json(
      {
        error: "Failed to update GrandOpening",
        detail: error.message ?? error,
      },
      { status }
    );
  }

  return NextResponse.json({ data }, { status: 200 });
}

// DELETE /api/progress/[id]/grand-opening
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canProgressKplt("delete", user) && !canProgressKplt("update", user))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!user.branch_id)
    return NextResponse.json(
      { error: "Forbidden", message: "User has no branch" },
      { status: 403 }
    );
    const check = await validateProgressAccess(supabase, user, params.id);
  if (!check.allowed)
    return NextResponse.json({ error: check.error }, { status: check.status });

  const progressId = params?.id;
  if (!progressId)
    return NextResponse.json({ error: "Invalid id" }, { status: 422 });

  const { data, error } = await supabase.rpc("fn_go_delete", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
  });

  if (error) {
    const status = (error as any)?.code === "22023" ? 409 : 500;
    return NextResponse.json(
      {
        error: "Failed to delete GrandOpening",
        detail: error.message ?? error,
      },
      { status }
    );
  }

  return NextResponse.json({ data }, { status: 200 });
}
