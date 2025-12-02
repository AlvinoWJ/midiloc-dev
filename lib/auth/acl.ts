import { createClient } from "@/lib/supabase/server";

// 1. Sentralisasi Definisi Posisi
export type InternalPositionName =
  | "regional manager"
  | "location manager"
  | "branch manager"
  | "location specialist"
  | "general manager"
  | "admin branch";

// Single Source of Truth
export const POSITION = {
  REGIONAL_MANAGER: "regional manager" as InternalPositionName,
  LOCATION_MANAGER: "location manager" as InternalPositionName,
  BRANCH_MANAGER: "branch manager" as InternalPositionName,
  LOCATION_SPECIALIST: "location specialist" as InternalPositionName,
  GENERAL_MANAGER: "general manager" as InternalPositionName,
  ADMIN_BRANCH: "admin branch" as InternalPositionName,
} as const;

// Tipe Aksi yang mungkin dilakukan
type Action =
  | "read"
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "final-approve"
  | "assign";

// Struktur Config Permissions
type RolePermissionConfig = {
  canUlok: Action[];
  canKplt: Action[];
  canUlokEksternal: Action[];
  canUlokEksisting: Action[];
  canProgressKplt: Action[];
};

// ==============================================================================
// CONFIGURATION OBJECT (Editable role access)
// ==============================================================================
const ROLE_CONFIG: Record<string, RolePermissionConfig> = {
  [POSITION.LOCATION_SPECIALIST]: {
    canUlok: ["read", "create", "update", "delete"],
    canKplt: ["read", "create", "update", "delete"],
    canUlokEksternal: ["read", "approve"],
    canUlokEksisting: ["read"],
    canProgressKplt: ["read"],
  },
  [POSITION.LOCATION_MANAGER]: {
    canUlok: ["read", "approve"],
    canKplt: ["read", "update"],
    canUlokEksternal: ["read", "assign"],
    canUlokEksisting: ["read"],
    canProgressKplt: ["read"],
  },
  [POSITION.BRANCH_MANAGER]: {
    canUlok: ["read"],
    canKplt: ["read", "approve"],
    canUlokEksternal: ["read"],
    canUlokEksisting: ["read"],
    canProgressKplt: ["read"],
  },
  [POSITION.REGIONAL_MANAGER]: {
    canUlok: ["read"],
    canKplt: ["read", "approve"],
    canUlokEksternal: ["read", "assign"],
    canUlokEksisting: ["read"],
    canProgressKplt: ["read"],
  },
  [POSITION.GENERAL_MANAGER]: {
    canUlok: ["read"],
    canKplt: ["read", "final-approve"],
    canUlokEksternal: ["read"],
    canUlokEksisting: ["read"],
    canProgressKplt: ["read"],
  },
  [POSITION.ADMIN_BRANCH]: {
    canUlok: ["read"],
    canKplt: ["read"],
    canUlokEksternal: ["read"],
    canUlokEksisting: ["read"],
    canProgressKplt: ["read", "update", "create"],
  },
};

// ==============================================================================
// LOGIC (Generic Functions - Closed for Modification)
// ==============================================================================
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

// Mengambil permissions user saat ini
function getPermissions(user: CurrentUser): RolePermissionConfig | null {
  if (!user.position_nama) return null;
  return ROLE_CONFIG[user.position_nama.toLowerCase()] || null;
}

export function canUlok(action: Action, user: CurrentUser) {
  const perms = getPermissions(user);
  return perms ? perms.canUlok.includes(action) : false;
}

export function canKplt(action: Action, user: CurrentUser) {
  const perms = getPermissions(user);
  return perms ? perms.canKplt.includes(action) : false;
}

export function canUlokEksternal(action: Action, user: CurrentUser) {
  const perms = getPermissions(user);
  return perms ? perms.canUlokEksternal.includes(action) : false;
}

export function canUlokEksisting(action: Action, user: CurrentUser) {
  const perms = getPermissions(user);
  return perms ? perms.canUlokEksisting.includes(action) : false;
}

export function canProgressKplt(action: Action, user: CurrentUser) {
  // Logic khusus: Admin Branch selalu TRUE (bypass config)
  if (user.position_nama === POSITION.ADMIN_BRANCH) return true;

  const perms = getPermissions(user);
  return perms ? perms.canProgressKplt.includes(action) : false;
}

// Helper khusus non-CRUD
export function isRegionalOrAbove(user: CurrentUser): boolean {
  return (
    user.position_nama === POSITION.REGIONAL_MANAGER ||
    user.position_nama === POSITION.GENERAL_MANAGER
  );
}

// ==============================================================================
// AUTH FUNCTION
// ==============================================================================
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
  const md = user.app_metadata || {};

  // (Sesuaikan dengan field yang Anda simpan di SQL Trigger)
  if (md.role_nama && md.position_nama && md.branch_nama) {
    // Casting type aman untuk data dari metadata
    const roleNama = (md.role_nama as string).toLowerCase();
    const positionNama = (md.position_nama as string).toLowerCase();
    const branchId = (md.branch_id as string) || null;
    const branchNama = (md.branch_nama as string)?.toLowerCase() || null;

    // Return data user LENGKAP tanpa query DB tambahan
    return {
      id: uid,
      email: user.email ?? null,
      nama: user.user_metadata?.nama ?? null,

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
