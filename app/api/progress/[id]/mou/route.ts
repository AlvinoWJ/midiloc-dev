/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canProgressKplt } from "@/lib/auth/acl";
import { MouCreateSchema, MouUpdateSchema } from "@/lib/validations/mou";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  if (!canProgressKplt("read", user))
    return NextResponse.json(
      {
        success: false,
        error: "Forbidden",
        message: "Anda tidak berhak melakukan aksi ini",
      },
      { status: 403 }
    );

  const progressId = params.id;
  const { data, error } = await supabase
    .from("mou")
    .select("*")
    .eq("progress_kplt_id", progressId)
    .maybeSingle();

  if (error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );

  return NextResponse.json({ success: true, data }, { status: 200 });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  if (!canProgressKplt("create", user))
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
      { success: false, error: "Forbidden", message: "No branch" },
      { status: 403 }
    );

  const progressId = params.id;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json(
      { success: false, error: "Bad Request" },
      { status: 400 }
    );

  const parsed = MouCreateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        detail: parsed.error.issues,
      },
      { status: 422 }
    );

  const { data, error } = await supabase.rpc("fn_mou_create", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
    p_payload: parsed.data,
  });

  if (error) {
    const code = (error as any).code;
    if (code === "23505")
      return NextResponse.json(
        { success: false, error: "Conflict", message: "MOU already exists" },
        { status: 409 }
      );
    return NextResponse.json(
      { success: false, error: "RPC Error", detail: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, ...(data as any) },
    { status: 201 }
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
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
      { success: false, error: "Forbidden", message: "No branch" },
      { status: 403 }
    );

  const progressId = params.id;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object")
    return NextResponse.json(
      { success: false, error: "Bad Request" },
      { status: 400 }
    );

  const parsed = MouUpdateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        detail: parsed.error.issues,
      },
      { status: 422 }
    );

  const { data, error } = await supabase.rpc("fn_mou_update", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
    p_payload: parsed.data,
  });

  if (error) {
    const msg = error.message;
    if (msg?.includes("finalized"))
      return NextResponse.json(
        { success: false, error: "Conflict", message: msg },
        { status: 409 }
      );
    return NextResponse.json(
      { success: false, error: "RPC Error", detail: msg },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, ...(data as any) },
    { status: 200 }
  );
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  if (!canProgressKplt("delete", user))
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  if (!user.branch_id)
    return NextResponse.json(
      { success: false, error: "Forbidden", message: "No branch" },
      { status: 403 }
    );

  const progressId = params.id;

  const { data, error } = await supabase.rpc("fn_mou_delete", {
    p_user_id: user.id,
    p_branch_id: user.branch_id,
    p_progress_kplt_id: progressId,
  });

  if (error) {
    const msg = error.message;
    if (msg?.includes("finalized"))
      return NextResponse.json(
        { success: false, error: "Conflict", message: msg },
        { status: 409 }
      );
    if (msg?.includes("not found"))
      return NextResponse.json(
        { success: false, error: "Not Found", message: msg },
        { status: 404 }
      );
    return NextResponse.json(
      { success: false, error: "RPC Error", detail: msg },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, ...(data as any) },
    { status: 200 }
  );
}
