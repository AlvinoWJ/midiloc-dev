import { createClient } from "@/lib/supabase/server";

// 1. Sentralisasi Definisi Posisi
export type InternalPositionName =
  | "regional manager"
  | "location manager"
  | "branch manager"
  | "location specialist"
  | "general manager" // Tambahkan yang sebelumnya terlewat di type tapi ada di logic
  | "admin branch"
  | "senior manager";

// Single Source of Truth
export const POSITION = {
  REGIONAL_MANAGER: "regional manager" as InternalPositionName,
  LOCATION_MANAGER: "location manager" as InternalPositionName,
  BRANCH_MANAGER: "branch manager" as InternalPositionName,
  LOCATION_SPECIALIST: "location specialist" as InternalPositionName,
  GENERAL_MANAGER: "general manager" as InternalPositionName,
  ADMIN_BRANCH: "admin branch" as InternalPositionName,
} as const;

export type CurrentUser = {
  id: string;
  email: string | null;
  nama: string | null;
  branch_id: string | null;
  branch_nama: string | null;
  position_id: string | null;
  position_nama: InternalPositionName | null; // Perbaiki type di sini
  role_nama: string | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  // 1. Ambil User dari Sesi Auth (Cepat, tidak hit database user profile)
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  const uid = user?.id;

  if (!uid) return null;

  // ---------------------------------------------------------------------------
  // 🚀 FAST PATH: Cek Custom Claims (Metadata Token)
  // ---------------------------------------------------------------------------
  // Kita cek apakah data kunci tersedia di tiket (token) user
  const md = user.app_metadata || {};

  // Minimal data yang wajib ada untuk dianggap valid
  // (Sesuaikan dengan field yang Anda simpan di SQL Trigger)
  if (md.role_nama && md.position_nama) {
    // Casting type aman untuk data dari metadata
    const roleNama = (md.role_nama as string).toLowerCase();
    const positionNama = (md.position_nama as string).toLowerCase();
    const branchId = (md.branch_id as string) || null;
    const branchNama = (md.branch_nama as string)?.toLowerCase() || null;

    // Return data user LENGKAP tanpa query DB tambahan
    return {
      id: uid,
      email: user.email ?? null,
      nama: user.user_metadata?.nama ?? null, // Nama user (profil) ada di user_metadata

      // Data Cabang
      branch_id: branchId,
      branch_nama: branchNama,

      // Data Jabatan
      position_id: (md.position_id as string) || null,
      position_nama: positionNama as InternalPositionName, // Pastikan sesuai type InternalPositionName

      // Data Role
      role_nama: roleNama,
    };
  }

  // ---------------------------------------------------------------------------
  // 🐢 SLOW PATH: Fallback ke Database (Jika token belum update/kosong)
  // ---------------------------------------------------------------------------
  // Ini hanya akan jalan jika user login SEBELUM sistem update ini dipasang,
  // atau jika terjadi masalah pada trigger database.

  const { data: dbUser, error } = await supabase
    .from("users")
    .select(
      `id, 
       email, 
       nama, 
       branch_id, 
       branch: branch_id (nama),
       position_id, 
       position: position_id (nama), 
       role_id, 
       role: role_id (nama)`
    )
    .eq("id", uid)
    .maybeSingle();

  if (error || !dbUser) return null;

  // Mapping hasil query DB yang nested ke format flat CurrentUser
  const userPositionArr = dbUser.position as
    | { nama: string }[]
    | { nama: string }
    | null;
  const userPosition = Array.isArray(userPositionArr)
    ? userPositionArr[0]
    : userPositionArr;
  const positionName = userPosition?.nama?.toLowerCase();

  const userRoleArr = dbUser.role as
    | { nama: string }[]
    | { nama: string }
    | null;
  const userRole = Array.isArray(userRoleArr) ? userRoleArr[0] : userRoleArr;
  const roleName = userRole?.nama?.toLowerCase();

  const userBranchArr = dbUser.branch as
    | { nama: string }[]
    | { nama: string }
    | null;
  const userBranch = Array.isArray(userBranchArr)
    ? userBranchArr[0]
    : userBranchArr;
  const branchName = userBranch?.nama?.toLowerCase();

  return {
    id: dbUser.id,
    email: dbUser.email ?? null,
    nama: dbUser.nama ?? null,
    branch_id: dbUser.branch_id ?? null,
    branch_nama: branchName ?? null,
    position_id: dbUser.position_id ?? null,
    position_nama: (positionName as InternalPositionName) ?? null,
    role_nama: roleName ?? null,
  };
}

// Helper sederhana untuk mempersingkat logic (Optional)
const matches = (user: CurrentUser, ...positions: InternalPositionName[]) => {
  return user.position_nama ? positions.includes(user.position_nama) : false;
};

export function isRegionalOrAbove(user: CurrentUser): boolean {
  return matches(user, POSITION.REGIONAL_MANAGER, POSITION.GENERAL_MANAGER);
}

// 2. Refactoring Function Logic
export function canUlok(
  action: "read" | "create" | "update" | "delete",
  user: CurrentUser
) {
  const { position_nama } = user;

  // Logic spesifik per role
  if (position_nama === POSITION.LOCATION_SPECIALIST) {
    return true; // Full access (sesuai kode lama)
  }

  if (position_nama === POSITION.LOCATION_MANAGER) {
    return action === "read" || action === "update";
  }

  // Grouping roles yang hanya boleh READ
  if (
    matches(
      user,
      POSITION.BRANCH_MANAGER,
      POSITION.REGIONAL_MANAGER,
      POSITION.ADMIN_BRANCH
    )
  ) {
    return action === "read";
  }

  return false;
}

export function canKplt(
  action: "read" | "create" | "update" | "approve" | "final-approve" | "delete",
  user: CurrentUser
) {
  const { position_nama } = user;

  // Menggunakan switch case dengan CONSTANT
  switch (position_nama) {
    case POSITION.LOCATION_SPECIALIST:
      return ["read", "create", "update", "delete"].includes(action);

    case POSITION.LOCATION_MANAGER:
      return action === "read" || action === "update";

    case POSITION.BRANCH_MANAGER:
    case POSITION.REGIONAL_MANAGER:
      return ["read", "update", "create"].includes(action);

    case POSITION.GENERAL_MANAGER:
      return ["read", "create", "update"].includes(action);

    case POSITION.ADMIN_BRANCH:
      return action === "read";

    default:
      return false;
  }
}

export function canProgressKplt(
  action: "read" | "create" | "update" | "delete",
  user: CurrentUser
) {
  if (user.position_nama === POSITION.ADMIN_BRANCH) return true;

  // Daftar role yang punya akses READ
  const readOnlyRoles: InternalPositionName[] = [
    POSITION.LOCATION_SPECIALIST,
    POSITION.LOCATION_MANAGER,
    POSITION.BRANCH_MANAGER,
    POSITION.REGIONAL_MANAGER,
    POSITION.GENERAL_MANAGER,
  ];

  if (matches(user, ...readOnlyRoles)) {
    return action === "read";
  }

  return false;
}

export function canUlokEksternal(
  action: "read" | "create" | "update" | "approve" | "final-approve" | "delete",
  user: CurrentUser
) {
  const { position_nama } = user;

  switch (position_nama) {
    case POSITION.LOCATION_SPECIALIST:
    case POSITION.LOCATION_MANAGER:
    case POSITION.BRANCH_MANAGER:
    case POSITION.REGIONAL_MANAGER:
      return action === "read" || action === "update";

    case POSITION.GENERAL_MANAGER:
    case POSITION.ADMIN_BRANCH:
      return action === "read";

    default:
      return false;
  }
}

export function canUlokEksisting(
  action: "read" | "create" | "update" | "approve" | "final-approve" | "delete",
  user: CurrentUser
) {
  // Semua role di bawah ini hanya boleh READ
  const readOnlyRoles: InternalPositionName[] = [
    POSITION.LOCATION_SPECIALIST,
    POSITION.LOCATION_MANAGER,
    POSITION.BRANCH_MANAGER,
    POSITION.REGIONAL_MANAGER,
    POSITION.GENERAL_MANAGER,
    POSITION.ADMIN_BRANCH,
  ];

  if (matches(user, ...readOnlyRoles)) {
    return action === "read";
  }

  return false;
}
