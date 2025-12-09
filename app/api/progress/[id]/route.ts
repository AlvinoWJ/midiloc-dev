/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUser,
  canProgressKplt,
  isRegionalOrAbove,
} from "@/lib/auth/acl";
import { validateProgressAccess } from "@/utils/kpltProgressBranchChecker";

export const dynamic = "force-dynamic";

/**
 * @route GET /api/progress/[id]
 * @description Mengambil detail Progress KPLT beserta Timeline statusnya.
 * Melakukan validasi branch checking.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const user = await getCurrentUser();

    // 1. Auth Check
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    if (!canProgressKplt("read", user)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
    if (!user.branch_id) {
      return NextResponse.json(
        { success: false, error: "Forbidden", message: "User has no branch" },
        { status: 403 }
      );
    }

    // 2. Validate Access (Branch & Existence)
    const check = await validateProgressAccess(supabase, user, id);
    if (!check.allowed)
      return NextResponse.json(
        { error: check.error },
        { status: check.status }
      );

    const progressId = id;
    if (!progressId) {
      return NextResponse.json(
        {
          success: false,
          error: "Bad Request",
          message: "Missing progress id",
        },
        { status: 422 }
      );
    }

    // 3. Fetch Data Detail
    // Menggunakan single query untuk mengambil data progress dan relasi kplt
    const progressColumns = [
      "id",
      "kplt_id",
      "status",
      "created_at",
      "updated_at",
      "kplt:kplt_id (*)",
    ].join(",");

    const { data: progress, error: progressErr } = await supabase
      .from("progress_kplt")
      .select(progressColumns)
      .eq("id", progressId)
      .maybeSingle();

    if (progressErr) {
      console.error("[PROGRESS_DETAIL_DB]", progressErr);
      return NextResponse.json(
        { error: "Failed to fetch progress detail" },
        { status: 500 }
      );
    }

    if (!progress) {
      return NextResponse.json(
        { error: "Progress not found" },
        { status: 404 }
      );
    }

    // 4. Double Check Branch Scope (Security Layer)
    // Walaupun validateProgressAccess sudah mengecek, ini memastikan data yang di-return sesuai scope.
    const kpltData = (progress as any).kplt;
    const branchId = kpltData?.branch_id;
    const isSuperUser = isRegionalOrAbove(user);
    if (!isSuperUser && branchId && branchId !== user.branch_id) {
      return NextResponse.json(
        { error: "Forbidden: Progress out of branch scope" },
        { status: 403 }
      );
    }
    // 5. Fetch Timeline via RPC
    const targetBranchId = branchId || user.branch_id;
    const { data: timelineResp, error: tlErr } = await supabase.rpc(
      "fn_progress_timeline",
      {
        p_branch_id: targetBranchId,
        p_progress_kplt_id: progressId,
      }
    );

    if (tlErr) {
      console.error("[PROGRESS_TIMELINE_RPC]", tlErr);
      return NextResponse.json(
        { error: "Failed to fetch timeline" },
        { status: 500 }
      );
    }

    // 6. Return Response
    return NextResponse.json(
      {
        success: true,
        data: {
          progress, // Struktur sudah sesuai query select di atas
          timeline: (timelineResp as any)?.timeline ?? [],
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[PROGRESS_DETAIL_GET] Unhandled:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
