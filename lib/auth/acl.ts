import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  // Tambahan profil untuk kebutuhan response API
  id: string;
  email: string | null;
  nama: string | null;
  branch_id: string | null;
  branch_nama: string | null; // users.branch_id -> branch.nama
  position_id: string | null;
  position_nama: string | null; // users.position_id -> position.nama
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return null;

  const { data: user, error } = await supabase
    .from("users")
    .select(
      "id, email, nama, branch_id, branch: branch_id (nama),position_id, position: position_id (nama)"
    )
    .eq("id", uid)
    .maybeSingle();

  const userPosition = user?.position as { nama: string } | undefined;
  const positionName = userPosition?.nama?.toLowerCase();

  const userBranch = user?.branch as { nama: string } | undefined;
  const branchName = userBranch?.nama?.toLowerCase();

  if (error || !user || !positionName || !branchName) return null;

  return {
    id: user.id,
    email: user.email ?? null,
    nama: user.nama ?? null,
    branch_id: user.branch_id ?? null,
    branch_nama: branchName ?? null,
    position_id: user.position_id ?? null,
    position_nama: positionName ?? null,
  };
}
export function canUlok(
  action: "read" | "create" | "update" | "delete",
  user: CurrentUser
) {
  if (user.position_nama === "location specialist") return true;
  if (user.position_nama === "location manager")
    return action === "read" || action === "update";
  return false;
}

export function canKplt(
  action: "read" | "create" | "update" | "approve" | "final-approve",
  user: CurrentUser
) {
  switch (user.position_nama) {
    case "location specialist":
      return action === "read" || action === "create" || action === "update";
    case "location manager":
      return action === "read" || action === "update"; // data baru
    case "senior/branch manager":
      return action === "read" || action === "approve";
    case "general manager":
      return action === "read" || action === "final-approve";
    case "admin branch":
      return action === "read"; // membaca untuk konteks progres
    default:
      return false;
  }
}

export function canProgressKplt(action: "read" | "write", user: CurrentUser) {
  if (user.position_nama === "admin branch") return true; // write
  if (
    user.position_nama &&
    ["location manager", "senior/branch manager", "general manager"].includes(
      user.position_nama
    )
  ) {
    return action === "read";
  }
  return false;
}
