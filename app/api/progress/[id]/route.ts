/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUser,
  canProgressKplt,
  isRegionalOrAbove,
} from "@/lib/auth/acl";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const user = await getCurrentUser();

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

  const progressId = params?.id;
  if (!progressId) {
    return NextResponse.json(
      { success: false, error: "Bad Request", message: "Missing progress id" },
      { status: 422 }
    );
  }

  // Ambil detail progress + kplt + ulok ringkas
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
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch progress_kplt",
        detail: progressErr.message,
      },
      { status: 500 }
    );
  }

  if (!progress || typeof progress !== "object" || !("id" in progress)) {
    return NextResponse.json(
      { success: false, error: "Not Found", message: "Progress not found" },
      { status: 404 }
    );
  }

  // Scope branch oleh kplt.branch_id
  const branchId = (progress as any)?.kplt?.branch_id;
  const isSuperUser = isRegionalOrAbove(user);
  if (!isSuperUser) {
    {
      if (branchId && user.branch_id && branchId !== user.branch_id) {
        return NextResponse.json(
          {
            success: false,
            error: "Forbidden",
            message: "Progress out of branch scope",
          },
          { status: 403 }
        );
      }
    }
  }

  const targetBranchId = branchId || user.branch_id;

  // Panggil RPC timeline
  const { data: timelineResp, error: tlErr } = await supabase.rpc(
    "fn_progress_timeline",
    {
      p_branch_id: targetBranchId,
      p_progress_kplt_id: progressId,
    }
  );

  if (tlErr) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch timeline",
        detail: (tlErr as any).message ?? tlErr,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        progress: {
          id: (progress as any).id,
          kplt_id: (progress as any).kplt_id,
          status: (progress as any).status,
          created_at: (progress as any).created_at,
          updated_at: (progress as any).updated_at,
          kplt: (progress as any).kplt,
        },
        timeline: (timelineResp as any)?.timeline ?? [],
      },
    },
    { status: 200 }
  );
}
