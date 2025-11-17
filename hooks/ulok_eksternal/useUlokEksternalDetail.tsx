"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr-keys";
import type { AppUser } from "../useUser";

export type UlokEksternalDetail = {
  id: string;
  users_eksternal_id: string;
  latitude: number;
  longitude: number;
  desa_kelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  alamat: string;
  bentuk_objek: string;
  alas_hak: string;
  jumlah_lantai: number;
  lebar_depan: number;
  panjang: number;
  luas: number;
  harga_sewa: number;
  nama_pemilik: string;
  kontak_pemilik: string;
  created_at: string;
  updated_at: string;
  branch_id: { nama: string };
  penanggungjawab: { nama: string };
  foto_lokasi: string;
  status_ulok_eksternal: "OK" | "NOK" | "In Progress" | string;
  approved_at: string | null;
};

// 2. Definisikan tipe respons API
interface ApiUlokEksternalDetailResponse {
  data: UlokEksternalDetail;
  meta?: { user?: AppUser }; // Menjaga konsistensi
}

export function useUlokEksternalDetail(id: string) {
  const apiUrl = id ? swrKeys.ulokEksternalDetail(id) : null;

  const { data, error, isLoading, mutate } =
    useSWR<ApiUlokEksternalDetailResponse>(apiUrl);

  return {
    ulokEksternalDetail: data?.data,
    isLoading,
    isError: error,
    mutate,
  };
}
