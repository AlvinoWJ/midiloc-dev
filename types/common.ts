// types/common.ts

// ==================================
// 1. TIPE MODEL DATA (DATA MODELS)
// ==================================

// Tipe untuk pengguna yang sedang login
export interface CurrentUser {
  id: string;
  email?: string | null;
  nama?: string | null;
  branch_id?: string | null;
  branch_nama?: string | null;
  position_id?: string | null;
  position_nama?: string | null;
}

// --- Tipe untuk ULOK ---
export interface Ulok {
  id: string;
  nama_ulok: string;
  alamat: string;
  created_at: string;
  approval_status: string;
  latitude?: string;
  longitude?: string;
}

// --- Tipe untuk KPLT (hasil olahan untuk UI) ---
export interface Kplt {
  id: string;
  nama_kplt: string;
  alamat: string;
  created_at: string;
  approval_status: string;
}

// Tipe untuk setiap objek di dalam array "kplt_existing"
export interface KpltExisting {
  id: string;
  nama_kplt: string; // ✅ sesuai kebutuhan UI
  alamat: string; // ✅ sesuai kebutuhan UI
  created_at: string;
  approval_status: string; // ✅ sesuai kebutuhan UI
}

// Tipe untuk setiap objek di dalam array "kplt_from_ulok_ok"
export interface UlokForKplt {
  ulok_id: string;
  nama_ulok: string;
  approval_status: string;
}

// Tipe untuk objek "meta" pada respons KPLT
export interface KpltMeta {
  kplt_existing_count: number;
  kplt_from_ulok_ok_count: number;
}

// Tipe untuk keseluruhan respons dari API /api/kplt
export interface ApiKpltResponse {
  meta: KpltMeta;
  kplt_existing: KpltExisting[];
  kplt_from_ulok_ok: UlokForKplt[];
}

// ==================================
// 2. TIPE PROPERTI HALAMAN (PAGE PROPS)
// ==================================

// Tipe untuk KpltPageProps yang sudah sesuai dengan data dari API
export interface KpltPageProps {
  isLoading: boolean;
  isError: boolean;
  user: CurrentUser | null;

  // Data mentah dari API
  kpltExisting: KpltExisting[];
  ulokForKplt: UlokForKplt[];
  meta?: KpltMeta;
  filteredKplt: KpltExisting[];

  // State UI
  searchQuery: string;
  filterMonth: string;
  filterYear: string;
  activeTab: string;

  // Handler
  onSearch: (query: string) => void;
  onFilterChange: (month: string, year: string) => void;
  onTabChange: (tab: string) => void;
  isLocationSpecialist: () => boolean;
}

// Tipe untuk UlokPageProps (bisa dibuat lebih spesifik atau generik sesuai kebutuhan)
export interface UlokPageProps {
  isLoading: boolean;
  isError: boolean;
  user: CurrentUser | null;
  filteredUlok: Ulok[];
  searchQuery: string;
  filterMonth: string;
  filterYear: string;
  activeTab: string;
  onSearch: (query: string) => void;
  onFilterChange: (month: string, year: string) => void;
  onTabChange: (tab: string) => void;
  isLocationSpecialist: () => boolean;
}

// ... Tipe props lainnya ...
export interface DashboardPageProps {
  isLoading: boolean;
  isError: boolean;
  user: CurrentUser | null;
  propertiData: Ulok[];
}
