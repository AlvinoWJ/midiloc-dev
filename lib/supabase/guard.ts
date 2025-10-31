import type { SupabaseClient } from "@supabase/supabase-js";

// Memastikan progress_kplt berada dalam cabang user.
// Menggunakan embed ke kplt via FK progress_kplt_kplt_id_fkey dengan inner join.
export async function ensureProgressInBranch(
  supabase: SupabaseClient,
  progressId: string,
  branchId: string
): Promise<{ ok: true } | { error: { code: number; message: string } }> {
  if (!progressId || !branchId) {
    return { error: { code: 422, message: "Invalid progress or branch id" } };
  }

  const { data, error } = await supabase
    .from("progress_kplt")
    .select(
      `
      id,
      kplt:kplt!progress_kplt_kplt_id_fkey!inner (
        id,
        branch_id
      )
    `
    )
    .eq("id", progressId)
    .eq("kplt.branch_id", branchId)
    .limit(1)
    .maybeSingle();

  if (error) {
    return {
      error: {
        code: 500,
        message: error.message ?? "Failed to verify progress scope",
      },
    };
  }

  if (!data) {
    return {
      error: { code: 404, message: "Progress not found or out of scope" },
    };
  }

  return { ok: true };
}
