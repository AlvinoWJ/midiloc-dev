import useSWR from "swr";

// Tipe untuk objek kplt_id
export interface KpltDetail {
  id: string;
  apc: number;
  spd: number;
  std: number;
  luas: number;
  alamat: string;
  pe_rab: number;
  panjang: number;
  pdf_kks: string;
  ulok_id: string;
  alas_hak: string;
  excel_pe: string;
  latitude: number;
  pdf_foto: string;
  provinsi: string;
  skor_fpl: number;
  branch_id: string;
  excel_fpl: string;
  form_ukur: string | null;
  form_ulok: string;
  is_active: boolean;
  kabupaten: string;
  kecamatan: string;
  longitude: number;
  nama_kplt: string;
  pe_status: string;
  created_at: string;
  file_intip: string;
  harga_sewa: number;
  updated_at: string;
  updated_by: string;
  lebar_depan: number;
  bentuk_objek: string;
  format_store: string;
  nama_pemilik: string;
  tanggal_ukur: string | null;
  jumlah_lantai: number;
  kplt_approval: string;
  peta_coverage: string;
  approval_intip: string;
  desa_kelurahan: string;
  kontak_pemilik: string;
  pdf_pembanding: string;
  sosial_ekonomi: string;
  karakter_lokasi: string;
  video_360_malam: string;
  video_360_siang: string;
  ulok_eksternal_id: string | null;
  counting_kompetitor: string;
  video_traffic_malam: string;
  video_traffic_siang: string;
  tanggal_approval_intip: string;
}

export interface ProgressDetailData {
  id: string;
  kplt_id: KpltDetail;
}

interface ApiResponse {
  data: {
    data: ProgressDetailData;
    meta: {
      progress_id: string;
      kplt_id: string;
    };
  };
}

// --- Fetcher Function ---
const fetcher = async (url: string): Promise<ProgressDetailData> => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error("Gagal mengambil data progress detail.");
    // Anda bisa tambahkan info lebih lanjut ke error object jika perlu
    throw error;
  }

  const json: ApiResponse = await res.json();
  return json.data.data; // Mengembalikan data yang sudah dibungkus
};

export function useProgressDetail(id: string | undefined) {
  const { data, error, isLoading } = useSWR(
    id ? `api/progress/${id}` : null,
    fetcher
  );

  return {
    progressDetail: data, // Data akan bertipe ProgressDetailData
    isLoading,
    isError: error,
  };
}
