// components/dashboard/DashboardMap.tsx
"use client";

import { useState, useEffect } from "react";
import { Properti } from "@/types/common";
import PetaLoader from "@/components/map/PetaLoader";

/**
 * Fungsi "Penerjemah" yang lebih aman.
 * Ia akan mengecek setiap properti sebelum menggunakannya.
 */
function adaptApiDataToProperti(apiData: any[]): Properti[] {
  if (!Array.isArray(apiData)) {
    console.error("ADAPTER ERROR: Data dari API bukan array.", apiData);
    return [];
  }

  const adaptedData = apiData
    .map((item) => {
      // Ubah string koordinat menjadi angka, atau null jika tidak valid
      const latitude = item.latitude ? parseFloat(item.latitude) : null;
      const longitude = item.longitude ? parseFloat(item.longitude) : null;

      // Hanya proses item ini jika koordinatnya valid setelah diubah
      if (
        latitude === null ||
        isNaN(latitude) ||
        longitude === null ||
        isNaN(longitude)
      ) {
        console.warn(
          "FILTERING: Data dibuang karena koordinat tidak valid.",
          item
        );
        return null; // Tandai untuk dibuang
      }

      return {
        id: item.id,
        nama: item.nama_ulok || "Nama Tidak Tersedia",
        alamat: item.alamat || item.desa_kelurahan || "Alamat Tidak Tersedia",
        latitude: latitude,
        longitude: longitude,
        status: item.approval_status || "In Progress",
        tanggal_pengajuan: item.created_at || new Date().toISOString(),
        // Nilai default untuk properti lain
        specialist_name: item.specialist_name || "N/A",
        harga: 0,
        luas_tanah: 0,
        luas_bangunan: 0,
      };
    })
    .filter((item): item is Properti => item !== null); // Buang semua item yang ditandai null

  return adaptedData;
}

export default function DashboardMap() {
  const [propertiData, setPropertiData] = useState<Properti[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUlokData() {
      console.log("Memulai pengambilan data dari /api/ulok...");
      try {
        const response = await fetch("/api/ulok");
        const result = await response.json();

        console.log("Respons mentah dari API /api/ulok:", result);

        if (response.ok && result.success && Array.isArray(result.data)) {
          if (result.data.length === 0) {
            console.warn(
              "API berhasil, tetapi tidak ada data yang dikembalikan. Cek filter di API Route (branch_id, users_id)."
            );
          }
          const adaptedData = adaptApiDataToProperti(result.data);

          setPropertiData(adaptedData);
        } else {
          console.error(
            "API mengembalikan error atau format data tidak sesuai:",
            result.message || result
          );
        }
      } catch (error) {
        console.error("Gagal menjalankan fetch:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUlokData();
  }, []);

  return (
    <div className="mt-8">
      <div className="bg-white p-4 rounded-lg shadow-md h-[500px] w-full border">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center">
            <p>Memuat data peta...</p>
          </div>
        ) : (
          <PetaLoader data={propertiData} />
        )}
      </div>
    </div>
  );
}
