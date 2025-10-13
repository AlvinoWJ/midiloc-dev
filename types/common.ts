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
  branch_name: string;
}

interface BreakdownRow {
  nama: string;
  user_id: string;
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
  type: string;
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
  kplt_approval: string; // ✅ sesuai kebutuhan UI
}

// Tipe untuk setiap objek di dalam array "kplt_from_ulok_ok"
export interface UlokForKplt {
  ulok_id: string;
  nama_ulok: string;
  alamat: string;
  created_at: string;
  ui_status: string;
  approval_status: string;
}

// Tipe data terpadu untuk ditampilkan di card UI
export interface UnifiedKpltItem {
  id: string;
  nama: string;
  alamat: string;
  created_at: string;
  status: string;
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

// ==================================
// DASHBOARD page props
// ==================================
export interface DashboardPageProps {
  propertiData?: DashboardData;
  propertiUntukPeta?: Properti[];
  isLoading: boolean;
  isMapLoading: boolean;
  isError: any;
  user: CurrentUser | null; // <-- Ini sudah benar menggunakan CurrentUser
  setYear: (year: number | null) => void;
  selectedSpecialistId: string | null;
  onSpecialistChange: (id: string | null) => void;
  activeMapFilter: "ulok" | "kplt";
  onMapFilterChange: (filter: "ulok" | "kplt") => void;
}

export interface Properti {
  id: string;
  latitude: string;
  longitude: string;
  nama?: string;
  nama_ulok?: string; // sudah ada
  alamat?: string; // sudah ada
  approval_status: string; // sudah ada
  created_at?: string; // sudah ada
  type: "ulok" | "kplt";
  ulok_id?: string;
}

export interface UlokApiResponse {
  success: boolean;
  data: Properti[]; // 'data' berisi array dari Properti/Ulok
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
  alas_hak: string; // Tipe string, bukan boolean, berdasarkan contoh "false"
  latitude: string;
  provinsi: string;
  form_ulok: string; // Bisa jadi null
  is_active: boolean;
  kabupaten: string;
  kecamatan: string;
  longitude: string;
  nama_kplt: string;
  file_intip: string; // Bisa jadi null
  harga_sewa: number;
  lebar_depan: number;
  bentuk_objek: string;
  format_store: string;
  nama_pemilik: string;
  jumlah_lantai: number;
  desa_kelurahan: string;
  kontak_pemilik: string;
  approval_intip_status: string;
  tanggal_approval_intip: string; // Bisa jadi null
  kplt_approval: string;
};

export type KpltBaseUIMapped = {
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
  fileIntip: string | null;
  approvalIntipStatus: string;
  tanggalApprovalIntip: string | null;
  kpltapproval?: string;
};

/**
 * Merepresentasikan struktur data lengkap yang dikembalikan
 * oleh API prefill KPLT.
 */
export type PrefillKpltResponse = {
  base: KpltBaseData;
  ulok_id: string; // UUID
  exists_kplt: boolean;
};

// // types/common.ts
// export interface KpltDetailResponse {
//   data: {
//     karakter_lokasi: string;
//     sosial_ekonomi: string;
//     skor_fpl: number;
//     std: number;
//     apc: number;
//     spd: number;
//     pe_status: string;
//     pe_rab: number;
//   };
//   files: {
//     pdf_foto_url: string | null;
//     counting_kompetitor_url: string | null;
//     pdf_pembanding_url: string | null;
//     pdf_kks_url: string | null;
//     excel_fpl_url: string | null;
//     excel_pe_url: string | null;
//     pdf_form_ukur_url: string | null;
//     video_traffic_siang_url: string | null;
//     video_traffic_malam_url: string | null;
//     video_360_siang_url: string | null;
//     video_360_malam_url: string | null;
//     peta_coverage_url: string | null;
//   };
// }
