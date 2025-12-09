"use client";

import useSWR from "swr";

/**
 * Interface TokoExistingDetailData
 * --------------------------------
 * Struktur data lengkap untuk satu Toko Existing.
 * Data ini merupakan gabungan dari berbagai informasi:
 * - Operasional (APC, SPD, STD, Tgl GO)
 * - Fisik (Luas, Panjang, Lebar, Koordinat)
 * - Finansial (Nilai Sewa, Harga Final)
 * - Legalitas & Admin (Alas Hak, NPWP/Pajak, Pemilik)
 */
export interface TokoExistingDetailData {
  apc: number;
  spd: number;
  std: number;
  luas: number;
  nama: string;
  alamat: string;
  pe_rab: number;
  tgl_go: string;
  panjang: number;
  alas_hak: string;
  latitude: number;
  provinsi: string;
  awal_sewa: string;
  kabupaten: string;
  kecamatan: string;
  longitude: number;
  nama_kplt: string;
  tipe_toko: string;
  akhir_sewa: string;
  kode_store: string;
  nilai_sewa: number;
  harga_final: number;
  lebar_depan: number;
  bentuk_objek: string;
  format_store: string;
  grace_period: number;
  nama_pemilik: string;
  periode_sewa: number;
  status_pajak: string;
  jumlah_lantai: number;
  desa_kelurahan: string;
  kontak_pemilik: string;
  pembayaran_pph: string;
  sosial_ekonomi: string;
  cara_pembayaran: string;
  karakter_lokasi: string;
  progress_kplt_id: string;
}

/**
 * Wrapper Response API standar.
 */
interface ApiTokoExistingDetailResponse {
  data: TokoExistingDetailData;
  success: boolean;
}

/**
 * Custom Hook: useTokoExistingDetail
 * ----------------------------------
 * Mengambil detail data Toko Existing (Ulok Eksisting) berdasarkan ID.
 * Digunakan pada halaman detail untuk menampilkan informasi lengkap toko.
 * * @param id - ID Toko/Progress yang akan diambil.
 */
export function useTokoExistingDetail(id: string | undefined) {
  // Conditional Fetching:
  // Jika ID tidak ada (undefined/null), set key null agar SWR tidak request.
  const key = id ? `/api/ulok_eksisting/${id}` : null;

  const { data, error, isLoading } = useSWR<ApiTokoExistingDetailResponse>(
    key,
    {
      // Optimasi: Jangan refresh data otomatis saat window fokus.
      // Data detail toko existing cenderung statis/jarang berubah real-time.
      revalidateOnFocus: false,
    }
  );

  return {
    tokoDetail: data?.data, // Objek data utama
    isLoading, // State loading
    isError: !!error, // Boolean error flag
  };
}
