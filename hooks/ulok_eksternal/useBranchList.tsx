"use client"; // Menandakan bahwa komponen ini dijalankan di sisi klien (Next.js App Router)

import useSWR from "swr";

// Endpoint API yang digunakan sebagai 'key' unik untuk caching SWR
const swrKey = "/api/ulok_eksternal/branch";

/**
 * Tipe data untuk entitas Branch (Cabang).
 * Merepresentasikan struktur data satu cabang sesuai response database/API.
 */
export type Branch = {
  id: string;
  nama: string;
  alamat: string;
  is_active: boolean;
  kode_branch: string;
};

/**
 * Interface untuk membungkus struktur response API.
 * Digunakan karena API mengembalikan objek dengan properti 'items'.
 */
interface ApiBranchListResponse {
  items: Branch[];
}

/**
 * Custom Hook: useBranchList
 * --------------------------
 * Hook reusable untuk mengambil daftar branch menggunakan SWR.
 * Mengenkapsulasi logika fetching, loading state, dan error handling.
 *
 * @returns {Object} Mengembalikan objek berisi:
 * - branches: Array data Branch (atau undefined saat inisialisasi)
 * - isLoadingBranches: Boolean status pemuatan data
 * - isErrorBranches: Error object jika terjadi kesalahan
 */
export function useBranchList() {
  // Memanggil hook useSWR dengan Generic Type <ApiBranchListResponse> agar 'data' ter-type dengan benar.
  // Note: Diasumsikan 'fetcher' sudah dikonfigurasi secara global pada SWRConfig.
  const { data, error, isLoading } = useSWR<ApiBranchListResponse>(swrKey);

  return {
    // Menggunakan optional chaining (?.) untuk akses aman ke properti 'items'
    // Jika data belum tersedia (null/undefined), branches akan bernilai undefined
    branches: data?.items,
    isLoadingBranches: isLoading,
    isErrorBranches: error,
  };
}
