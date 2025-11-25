import { createClient } from "@/lib/supabase/server";

export type InternalPositionName =
  | "regional manager"
  | "location manager"
  | "branch manager"
  | "location specialist";

export const POSITION = {
  REGIONAL_MANAGER: "regional manager" as InternalPositionName,
  LOCATION_MANAGER: "location manager" as InternalPositionName,
  BRANCH_MANAGER: "branch manager" as InternalPositionName,
  LOCATION_SPECIALIST: "location specialist" as InternalPositionName,
};

export type CurrentUser = {
  id: string;
  email: string | null;
  nama: string | null;
  branch_id: string | null;
  branch_nama: string | null;
  position_id: string | null;
  position_nama: string | null;
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
  if (
    user.position_nama === "branch manager" ||
    user.position_nama === "regional manager" ||
    user.position_nama === "admin branch"
  )
    return action === "read";
  return false;
}

export function canKplt(
  action: "read" | "create" | "update" | "approve" | "final-approve" | "delete",
  user: CurrentUser
) {
  switch (user.position_nama?.toLowerCase()) {
    case "location specialist":
      return (
        action === "read" ||
        action === "create" ||
        action === "update" ||
        action === "delete"
      );
    case "location manager":
      return action === "read" || action === "update";
    case "branch manager":
      return action === "read" || action === "update" || action === "create";
    case "regional manager":
      return action === "read" || action === "update" || action === "create";
    case "general manager":
      return action === "read" || action === "create" || action === "update";
    case "admin branch":
      return action === "read";
    default:
      return false;
  }
}

export function canProgressKplt(
  action: "read" | "create" | "update" | "delete",
  user: CurrentUser
) {
  if (user.position_nama === "admin branch") return true;
  if (
    user.position_nama &&
    [
      "location specialist",
      "location manager",
      "senior manager",
      "branch manager",
      "regional manager",
      "general manager",
    ].includes(user.position_nama)
  ) {
    return action === "read";
  }
  return false;
}

export function canUlokEksternal(
  action: "read" | "create" | "update" | "approve" | "final-approve" | "delete",
  user: CurrentUser
) {
  switch (user.position_nama?.toLowerCase()) {
    case "location specialist":
      return action === "read" || action === "update";
    case "location manager":
      return action === "read" || action === "update";
    case "branch manager":
      return action === "read" || action === "update";
    case "regional manager":
      return action === "read" || action === "update";
    case "general manager":
      return action === "read";
    case "admin branch":
      return action === "read";
    default:
      return false;
  }
}

export function canUlokEksisting(
  action: "read" | "create" | "update" | "approve" | "final-approve" | "delete",
  user: CurrentUser
) {
  switch (user.position_nama?.toLowerCase()) {
    case "location specialist":
      return action === "read";
    case "location manager":
      return action === "read";
    case "branch manager":
      return action === "read";
    case "regional manager":
      return action === "read";
    case "general manager":
      return action === "read";
    case "admin branch":
      return action === "read";
    default:
      return false;
  }
}
