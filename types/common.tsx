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
  id: string;
  nama_ulok: string;
  alamat: string;
  latitude: string;
  longitude: string;
  approval_status: string; // Tipe spesifik untuk status
  created_at: string;
}

export interface DashboardPageProps {
  isLoading: boolean;
  isError: boolean;
  user: CurrentUser | null;
  propertiData: Properti[];
}
