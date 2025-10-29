// types/common.ts

// ==================================
// TIPE MODEL DATA (KPLT DATA MODELS)
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

// --- TIPE UNTUK DASHBOARD---
interface KpiData {
  total_kplt: number;
  total_ulok: number;
  total_kplt_approves: number;
  total_ulok_approves: number;
  presentase_kplt_approves: number;
  presentase_ulok_approves: number;
}

interface FilterData {
  role?: string;
  year: number | null;
  branch_id: string;
  branch_name?: string; // optional: response baru bisa tidak mengirim ini
  branch_filter_id?: string; // optional: response baru bisa null
  ls_user_id?: string | null;
  region_code?: number;
}

interface BreakdownRow {
  // Untuk type='user' (LM/BM)
  nama?: string;
  user_id?: string;

  // Untuk type='branch' (RM/GM)
  nama_cabang?: string;
  branch_id?: string;

  // MetriK
  ulok_total: number;
  ulok_ok: number;
  ulok_nok: number;
  ulok_in_progress: number;
  kplt_total: number;
  kplt_ok: number;
  kplt_nok: number;
  kplt_in_progress: number;
  kplt_waiting_for_forum: number;
}

interface BreakdownData {
  rows: BreakdownRow[];
  type: string; // 'user' | 'branch'
}

interface DonutChartItem {
  count: number;
  label: string;
  status: string;
  percentage: number;
}

interface MonthlyDataItem {
  bulan: string;
  month_start: string;
  total_kplt?: number;
  kplt_ok?: number;
  kplt_nok?: number;
  kplt_in_progress?: number;
  kplt_waiting_for_forum?: number;
  total_ulok?: number;
  ulok_ok?: number;
  ulok_nok?: number;
  ulok_in_progress?: number;
}

export interface DashboardData {
  kpis: KpiData;
  filters: FilterData;
  breakdown?: BreakdownData;
  donut_kplt: DonutChartItem[];
  donut_ulok: DonutChartItem[];
  perbulan_kplt: MonthlyDataItem[];
  perbulan_ulok: MonthlyDataItem[];
}

// --- Tipe untuk ULOK (legacy Properti) ---
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
  kplt_approval: string;
  latitude: string; // <-- Tambahkan ini
  longitude: string;
  ulok_id: string; // ✅ sesuai kebutuhan UI
  has_file_intip?: boolean;
  has_form_ukur?: boolean;
}

// Tipe untuk setiap objek di dalam array "kplt_from_ulok_ok"
export interface UlokForKplt {
  id: string;
  ulok_id: string;
  nama_ulok: string;
  alamat: string;
  created_at: string;
  ui_status: string;
  approval_status: string;
  latitude: string; // <-- Tambahkan ini
  longitude: string;
  has_file_intip?: boolean;
  has_form_ukur?: boolean;
}

// Tipe data terpadu untuk ditampilkan di card UI
export interface UnifiedKpltItem {
  id: string;
  nama: string;
  alamat: string;
  created_at: string;
  status: string;
  has_file_intip: boolean;
  has_form_ukur: boolean;
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

// Tipe untuk KpltPageProps yang sudah sesuai dengan data dari API
export interface KpltPageProps {
  isLoading: boolean;
  isError: boolean;
  user: CurrentUser | null;

  // Kirim data yang sudah digabung dan difilter
  displayData: UnifiedKpltItem[];

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

// ==================================
// ULOK page props
// ==================================
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

// ==================================
// Map points tipe (response baru)
// ==================================
export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  name?: string | null;
  status?: string | null;
  created_at?: string | null;
  ulok_id?: string | null;
  alamat?: string | null;
  // optional: jika data lama, field-field ini bisa ada
  latitude?: string | number | null;
  longitude?: string | number | null;
  nama?: string | null;
  nama_ulok?: string | null;
  approval_status?: string | null;
  type?: "ulok" | "kplt";
}

// ==================================
// DASHBOARD page props
// ==================================
export interface DashboardPageProps {
  propertiData?: DashboardData;
  // Izinkan union data peta (legacy Properti atau MapPoint baru)
  propertiUntukPeta?: (Properti | MapPoint)[];
  isLoading: boolean;
  isMapLoading: boolean;
  isError: any;
  user: CurrentUser | null; // <-- Ini sudah benar menggunakan CurrentUser
  setYear: (year: number | null) => void;
  selectedSpecialistId: string | null;
  onSpecialistChange: (id: string | null) => void;
  selectedBranchId: string | null;
  onBranchChange: (branchId: string | null) => void;
  activeMapFilter: "ulok" | "kplt";
  onMapFilterChange: (filter: "ulok" | "kplt") => void;
}

// Legacy Properti (dipakai komponen peta lama)
export interface Properti {
  id: string;
  latitude: string | number;
  longitude: string | number;
  nama?: string;
  nama_ulok?: string; // sudah ada
  alamat?: string; // sudah ada
  approval_status?: string; // bisa tidak ada di data baru -> optional
  created_at?: string; // sudah ada
  type?: "ulok" | "kplt";
  ulok_id?: string;
}

export interface UlokApiResponse {
  success: boolean;
  data: Properti[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================================
// KPLT page props
// ==================================

export type KpltBaseData = {
  luas: number;
  alamat: string;
  panjang: number;
  alas_hak: string;
  latitude: string;
  provinsi: string;
  form_ulok: string;
  is_active: boolean;
  kabupaten: string;
  kecamatan: string;
  longitude: string;
  nama_kplt: string;
  harga_sewa: number;
  lebar_depan: number;
  bentuk_objek: string;
  format_store: string;
  nama_pemilik: string;
  jumlah_lantai: number;
  desa_kelurahan: string;
  kontak_pemilik: string;
  tanggal_approval_intip: string;
  kplt_approval: string;
};

export type KpltBaseUIMapped = {
  id?: string;
  namaKplt: string;
  alamat: string;
  luas: number;
  panjang: number;
  lebarDepan: number;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desaKelurahan: string;
  latitude: string;
  longitude: string;
  formatStore: string;
  hargaSewa: number;
  namaPemilik: string;
  kontakPemilik: string;
  alasHak: string;
  bentukObjek: string;
  jumlahLantai: number;
  isActive: boolean;
  formUlok: string | null;
  kpltapproval?: string;
};

/**
 * Merepresentasikan struktur data lengkap yang dikembalikan
 * oleh API prefill KPLT.
 */
export type PrefillKpltResponse = {
  base: KpltBaseData;
  ulok_id: string;
  exists_kplt: boolean;
};
