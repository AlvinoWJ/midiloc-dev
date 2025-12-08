/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/acl";
import {
  GOCreateSchema,
  GOUpdateSchema,
  stripServerControlledFieldsGO,
} from "@/lib/validations/grand_opening";
import {
  checkAuthAndAccess,
  handleCommonError,
} from "@/lib/progress/api-helper";

export const dynamic = "force-dynamic";

/**
 * @route GET /api/progress/[id]/grand_opening
 * @description Mengambil detail data Grand Opening.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  //auth check
  const authErr = await checkAuthAndAccess(supabase, user, params.id, "read");
  if (authErr) return NextResponse.json(authErr, { status: authErr.status });

  //execute RPC
  const { data, error } = await supabase.rpc("fn_go_get", {
    p_user_id: user!.id,
    p_branch_id: user!.branch_id,
    p_progress_kplt_id: params.id,
  });

  if (error) return handleCommonError(error, "GO_GET");
  if (!data)
    return NextResponse.json({ error: "Data not found" }, { status: 404 });
  return NextResponse.json({ data }, { status: 200 });
}

/**
 * @route POST /api/progress/[id]/grand_opening
 * @description Membuat data Grand Opening baru.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    //auth check
    const authErr = await checkAuthAndAccess(
      supabase,
      user,
      params.id,
      "create"
    );
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    const body = await req.json().catch(() => ({}));
    const parsed = GOCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }
    const payload = stripServerControlledFieldsGO(parsed.data);

    const { data, error } = await supabase.rpc("fn_go_create", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: params.id,
      p_payload: payload,
    });
    if (error) {
      const msg = (error.message || "").toLowerCase();
      if (msg.includes("prerequisite") || msg.includes("renovasi")) {
        return NextResponse.json(
          { error: "Prerequisite Renovasi not met" },
          { status: 422 }
        );
      }
      return handleCommonError(error, "GO_CREATE");
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err: any) {
    return handleCommonError(err, "GO_POST_UNHANDLED");
  }
}

/**
 * @route PATCH /api/progress/[id]/grand_opening
 * @description Mengupdate data Grand Opening.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();
    const authErr = await checkAuthAndAccess(
      supabase,
      user,
      params.id,
      "update"
    );
    if (authErr) return NextResponse.json(authErr, { status: authErr.status });

    const body = await req.json().catch(() => ({}));
    const parsed = GOUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    const payload = stripServerControlledFieldsGO(parsed.data);

    const { data, error } = await supabase.rpc("fn_go_update", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: params.id,
      p_payload: payload,
    });

    if (error) {
      return handleCommonError(error, "GO_UPDATE");
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    return handleCommonError(err, "GO_PATCH_UNHANDLED");
  }
}

/**
 * @route DELETE /api/progress/[id]/grand_opening
 * @description Menghapus data Grand Opening.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  //auth check
  const authErr = await checkAuthAndAccess(supabase, user, params.id, "delete");
  if (authErr) return NextResponse.json(authErr, { status: authErr.status });
  const { data, error } = await supabase.rpc("fn_go_delete", {
    p_user_id: user!.id,
    p_branch_id: user!.branch_id,
    p_progress_kplt_id: params.id,
  });

  if (error) return handleCommonError(error, "GO_DELETE");

  return NextResponse.json({ data }, { status: 200 });
}
