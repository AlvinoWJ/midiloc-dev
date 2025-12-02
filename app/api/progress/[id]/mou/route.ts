/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, canProgressKplt } from "@/lib/auth/acl";
import { MouCreateSchema, MouUpdateSchema } from "@/lib/validations/mou";
import { validateProgressAccess } from "@/utils/kpltProgressBranchChecker";
import { isDbError } from "@/lib/storage/path";

export const dynamic = "force-dynamic";

/**
 * Helper: Validasi User, Permission, Branch, dan Akses Progress ID.
 * Mengembalikan objek error response jika gagal, atau null jika sukses.
 */
async function checkAuthAndAccess(
  supabase: any,
  user: any,
  progressId: string,
  action: "read" | "create" | "update" | "delete"
) {
  if (!user) return { error: "Unauthorized", status: 401 };
  if (!canProgressKplt(action, user))
    return { error: "Forbidden", status: 403 };
  if (!user.branch_id) return { error: "Forbidden: No branch", status: 403 };

  const check = await validateProgressAccess(supabase, user, progressId);
  if (!check.allowed) return { error: check.error, status: check.status };

  return null; // All checks passed
}

// GET: Ambil data MOU
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const authErr = await checkAuthAndAccess(supabase, user, params.id, "read");
  if (authErr)
    return NextResponse.json(
      { error: authErr.error },
      { status: authErr.status }
    );

  const { data, error } = await supabase
    .from("mou")
    .select("*")
    .eq("progress_kplt_id", params.id)
    .maybeSingle();

  if (error) {
    console.error("[MOU_GET]", error);
    return NextResponse.json({ error: "Failed to fetch MOU" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 200 });
}

// POST: Buat MOU Baru
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    const authErr = await checkAuthAndAccess(
      supabase,
      user,
      params.id,
      "create"
    );
    if (authErr)
      return NextResponse.json(
        { error: authErr.error },
        { status: authErr.status }
      );

    const body = await req.json().catch(() => null);
    const parsed = MouCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    const { data, error } = await supabase.rpc("fn_mou_create", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: params.id,
      p_payload: parsed.data,
    });

    if (error) {
      const code = isDbError(error) ? error.code : null;
      if (code === "23505")
        return NextResponse.json(
          { error: "Conflict: MOU already exists" },
          { status: 409 }
        );

      console.error("[MOU_CREATE_RPC]", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ...data }, { status: 201 });
  } catch (e) {
    console.error("[MOU_POST] Unhandled:", e);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// PATCH: Update MOU
export async function PATCH(
  req: NextRequest,
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
    if (authErr)
      return NextResponse.json(
        { error: authErr.error },
        { status: authErr.status }
      );

    const body = await req.json().catch(() => null);
    const parsed = MouUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", detail: parsed.error.issues },
        { status: 422 }
      );
    }

    const { data, error } = await supabase.rpc("fn_mou_update", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: params.id,
      p_payload: parsed.data,
    });

    if (error) {
      const msg = error.message || "";
      if (msg.toLowerCase().includes("finalized")) {
        return NextResponse.json(
          { error: "Conflict: Progress finalized", message: msg },
          { status: 409 }
        );
      }
      console.error("[MOU_UPDATE_RPC]", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ...data }, { status: 200 });
  } catch (e) {
    console.error("[MOU_PATCH] Unhandled:", e);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// DELETE: Hapus MOU
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser();

    const authErr = await checkAuthAndAccess(
      supabase,
      user,
      params.id,
      "delete"
    );
    if (authErr)
      return NextResponse.json(
        { error: authErr.error },
        { status: authErr.status }
      );

    const { data, error } = await supabase.rpc("fn_mou_delete", {
      p_user_id: user!.id,
      p_branch_id: user!.branch_id,
      p_progress_kplt_id: params.id,
    });

    if (error) {
      const msg = error.message || "";
      if (msg.toLowerCase().includes("finalized")) {
        return NextResponse.json(
          { error: "Conflict: Progress finalized", message: msg },
          { status: 409 }
        );
      }
      if (msg.toLowerCase().includes("not found")) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
      }
      console.error("[MOU_DELETE_RPC]", error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ...data }, { status: 200 });
  } catch (e) {
    console.error("[MOU_DELETE] Unhandled:", e);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
