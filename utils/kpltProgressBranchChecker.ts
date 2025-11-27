import { isRegionalOrAbove } from "@/lib/auth/acl";

export async function validateProgressAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any,
  progressId: string
) {
  // 1. Ambil data branch pemilik progress ini via join ke tabel kplt
  const { data: progress, error } = await supabase
    .from("progress_kplt")
    .select(
      `
      id,
      kplt:kplt_id ( branch_id )
    `
    )
    .eq("id", progressId)
    .single();

  if (error || !progress) {
    // Jangan beri tahu detail error db, cukup "Not Found" untuk keamanan
    return { allowed: false, error: "Progress ID not found", status: 404 };
  }

  const dataBranchId = progress.kplt?.branch_id;

  const isSuperUser = isRegionalOrAbove(user);

  if (!isSuperUser) {
    // User Branch (LS/LM/BM) wajib punya branch yang sama dengan data
    if (!user.branch_id || user.branch_id !== dataBranchId) {
      return {
        allowed: false,
        error: "Forbidden: Akses lintas cabang ditolak",
        status: 403,
      };
    }
  }

  return { allowed: true, branchId: dataBranchId }; // Return branchId untuk dipass ke RPC jika perlu
}
