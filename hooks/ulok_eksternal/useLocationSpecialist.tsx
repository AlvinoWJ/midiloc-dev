"use client"; // Menandakan komponen ini berjalan di sisi klien (wajib untuk hooks di Next.js)

import useSWR from "swr";

// Endpoint API yang berfungsi sebagai kunci unik (key) untuk cache SWR
const swrKey = "/api/ulok_eksternal/location_specialist";

/**
 * Tipe data LocationSpecialist.
 * Merepresentasikan detail spesialis lokasi (karyawan/petugas) dalam sistem.
 */
export type LocationSpecialist = {
  id: string;
  nama: string;
  email: string;
  is_active: boolean;
  branch_id: string; // Foreign key ke tabel Branch
  position_id: string; // Foreign key ke tabel Position
};

/**
 * Interface untuk struktur respons API.
 * Menyesuaikan bentuk JSON dari backend yang membungkus data dalam array 'items'.
 */
interface ApiLocationSpecialistResponse {
  items: LocationSpecialist[];
}

/**
 * Custom Hook: useLocationSpecialistList
 * --------------------------------------
 * Mengambil daftar Location Specialist dari API.
 *
 * @returns {Object} Mengembalikan objek berisi:
 * - specialists: Array data (selalu array, tidak pernah undefined)
 * - isLoadingSpecialists: Status loading
 * - isErrorSpecialists: Error object jika fetch gagal
 */
export function useLocationSpecialistList() {
  // Menggunakan Generic Type <ApiLocationSpecialistResponse> untuk Type Safety pada 'data'
  const { data, error, isLoading } =
    useSWR<ApiLocationSpecialistResponse>(swrKey);

  return {
    // Penggunaan Nullish Coalescing Operator (?? [])
    // Jika data?.items bernilai undefined (belum load) atau null,
    // maka variabel 'specialists' akan diisi dengan array kosong [].
    // Ini mencegah error saat melakukan .map() di UI.
    specialists: data?.items ?? [],
    isLoadingSpecialists: isLoading,
    isErrorSpecialists: error,
  };
}
