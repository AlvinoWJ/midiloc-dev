"use client";

import useSWR from "swr";

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

interface ApiTokoExistingDetailResponse {
  data: TokoExistingDetailData;
  success: boolean;
}

export function useTokoExistingDetail(id: string | undefined) {
  const key = id ? `/api/ulok_eksisting/${id}` : null;

  const { data, error, isLoading } = useSWR<ApiTokoExistingDetailResponse>(
    key,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    tokoDetail: data?.data,
    isLoading,
    isError: !!error,
  };
}
