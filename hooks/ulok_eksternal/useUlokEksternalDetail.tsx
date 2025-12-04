"use client";

import useSWR from "swr";
import { swrKeys } from "@/lib/swr-keys"; // Import helper factory untuk konsistensi key SWR
import type { AppUser } from "../useUser";

/**
 * Tipe data detail untuk Ulok Eksternal (Usulan Lokasi Eksternal).
 * Mencakup data geografis, fisik bangunan, legalitas, dan relasi.
 */
export type UlokEksternalDetail = {
  id: string;
  users_eksternal_id: string;
  latitude: number;
  longitude: number;
  // --- Data Wilayah ---
  desa_kelurahan: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  alamat: string;
  // --- Data Fisik & Legalitas ---
  bentuk_objek: string; // Misal: Ruko, Tanah Kosong, dll.
  alas_hak: string; // Misal: SHM, HGB, dll.
  jumlah_lantai: number;
  lebar_depan: number;
  panjang: number;
  luas: number;
  harga_sewa: number;
  // --- Data Pemilik ---
  nama_pemilik: string;
  kontak_pemilik: string;
  // --- Metadata ---
  created_at: string;
  updated_at: string;

  // NOTE: Properti di bawah ini adalah objek (expanded relation), bukan sekadar ID string.
  // API sudah melakukan 'join' data branch dan penanggungjawab.
  branch_id: { nama: string; id: string };
  penanggungjawab: { nama: string; id: string };

  foto_lokasi: string;
  // Union type untuk status, dengan fallback string agar fleksibel jika ada status baru
  status_ulok_eksternal: "OK" | "NOK" | "In Progress" | string;
  approved_at: string | null;
};

/**
 * Struktur respons API untuk detail.
 * Data utama dibungkus dalam properti 'data'.
 */
interface ApiUlokEksternalDetailResponse {
  data: UlokEksternalDetail;
  meta?: { user?: AppUser }; // Metadata tambahan (opsional)
}

/**
 * Custom Hook: useUlokEksternalDetail
 * -----------------------------------
 * Mengambil satu data detail Ulok Eksternal berdasarkan ID.
 * Mendukung "Conditional Fetching": request hanya dikirim jika ID tersedia.
 *
 * @param {string} id - ID dari data yang ingin diambil (biasanya dari URL params).
 */
export function useUlokEksternalDetail(id: string) {
  // Logic Conditional Fetching:
  // Jika 'id' ada, gunakan function generator dari swrKeys.
  // Jika 'id' kosong/null, set key ke null. Ini memberi sinyal ke SWR untuk PAUSE (tidak fetch).
  const apiUrl = id ? swrKeys.ulokEksternalDetail(id) : null;

  const { data, error, isLoading, mutate } =
    useSWR<ApiUlokEksternalDetailResponse>(apiUrl);

  return {
    // Mengambil data spesifik dari response wrapper
    ulokEksternalDetail: data?.data,
    isLoading,
    isError: error,
    // Mengekspos fungsi mutate untuk memicu re-fetch manual
    // Berguna setelah melakukan update data (misal: setelah edit form) agar UI langsung berubah.
    mutate,
  };
}
