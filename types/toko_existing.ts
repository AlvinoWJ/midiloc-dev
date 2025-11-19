// types/toko_existing.ts
export interface TokoExistingItem {
  id: number;
  nama_toko: string;
  alamat: string;
  regional: string;
  tahun_beroperasi: number;
  status: "Active" | "Inactive" | "Pending"; // Status sederhana
  gambar_url?: string;
}

export interface TokoExistingMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
