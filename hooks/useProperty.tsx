// hooks/useProperti.ts
import useSWR from "swr";
import { Properti } from "@/types/common"; // Pastikan path ke tipe data Anda benar

// Pindahkan fungsi adapter ke sini agar terpusat
function adaptApiDataToProperti(apiData: any[]): Properti[] {
  if (!Array.isArray(apiData)) {
    console.error("ADAPTER ERROR: Data dari API bukan array.", apiData);
    return [];
  }

  const adaptedData = apiData
    .map((item) => {
      const latitude = item.latitude ? parseFloat(item.latitude) : null;
      const longitude = item.longitude ? parseFloat(item.longitude) : null;

      if (
        latitude === null ||
        isNaN(latitude) ||
        longitude === null ||
        isNaN(longitude)
      ) {
        return null;
      }

      return {
        id: item.id,
        nama: item.nama_ulok || "Nama Tidak Tersedia",
        alamat: item.alamat || item.desa_kelurahan || "Alamat Tidak Tersedia",
        latitude: latitude,
        longitude: longitude,
        status: item.approval_status || "In Progress",
        tanggal_pengajuan: item.created_at,
        specialist_name: item.specialist_name || "N/A",
        harga: 0,
        luas_tanah: 0,
        luas_bangunan: 0,
      };
    })
    .filter((item): item is Properti => item !== null);

  return adaptedData;
}

// Definisikan fetcher standar untuk digunakan dengan SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProperti() {
  // Gunakan SWR untuk mengambil data dari API route Anda
  const { data: result, error, isLoading } = useSWR("/api/ulok", fetcher);

  // Lakukan adaptasi data setelah SWR selesai mengambil data
  const adaptedData =
    result && result.success ? adaptApiDataToProperti(result.data) : [];

  return {
    properti: adaptedData,
    isLoading,
    isError: error,
  };
}
