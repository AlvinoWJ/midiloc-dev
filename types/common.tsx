export type Ulok = {
  id: string;
  nama_ulok: string;
  alamat: string;
  created_at: string;
  approval_status: string;
};

export type CurrentUser = {
  id: string;
  email?: string | null; // <-- Tambahkan ?
  nama?: string | null; // <-- Tambahkan ?
  branch_id?: string | null; // <-- Tambahkan ?
  branch_nama?: string | null; // <-- Tambahkan ?
  position_id?: string | null; // <-- Tambahkan ?
  position_nama?: string | null; // <-- Tambahkan ?
};

export interface UlokPageProps {
  isLoading: boolean;
  isError: boolean;
  searchQuery: string;
  filterMonth: string;
  filterYear: string;
  activeTab: string;
  user: CurrentUser | null;
  onSearch: (query: string) => void;
  onFilterChange: (month: string, year: string) => void;
  onTabChange: (tab: string) => void;
  isLocationSpecialist: () => boolean;
  filteredUlok: Ulok[];
}

export interface Properti {
  id: number;
  nama: string;
  alamat: string;
  harga: number; // Kita biarkan saja meski tidak dipakai di pop-up
  latitude: number;
  longitude: number;
  gambar_url: string;
  luas_tanah: number;
  luas_bangunan: number;

  // --- TAMBAHAN BARU ---
  status: "In Progress" | "OK" | "NOK"; // Tipe spesifik untuk status
  tanggal_pengajuan: string;
  specialist_name: string;
}

export interface DashboardPageProps {
  isLoading: boolean;
  isError: boolean;
  user: CurrentUser | null;
  propertiData: Properti[];
}
