// components/ui/DetailMapCard.tsx
"use client";

// import { useMemo } from "react";
import PetaLoader from "@/components/map/PetaLoader";
import { MapPin } from "lucide-react";
import { useUlokDetail } from "@/hooks/useUlokDetail";
import { Properti } from "@/types/common";

interface DetailMapCardProps {
  id: string;
}

export default function DetailMapCard({ id }: DetailMapCardProps) {
  const { ulokData, isLoading, errorMessage } = useUlokDetail(id);
  // Parsing latlong string menjadi angka

  // 3. Tampilkan pesan loading
  if (isLoading) {
    return (
      <div className="bg-gray-100 h-64 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">Memuat data peta...</p>
      </div>
    );
  }

  // 4. Tampilkan pesan error jika fetch gagal atau data tidak valid
  if (
    errorMessage ||
    !ulokData ||
    !ulokData.latlong ||
    !ulokData.latlong.includes(",")
  ) {
    return (
      <div className="bg-gray-100 h-64 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">
          Koordinat lokasi tidak valid atau gagal dimuat.
        </p>
      </div>
    );
  }

  // Siapkan data untuk PetaLoader dari data yang sudah di-fetch
  const [latitude, longitude] = ulokData.latlong.split(",").map(String);
  const markerData: Properti[] = [
    {
      id: ulokData.id,
      latitude,
      longitude,
      nama_ulok: ulokData.namaUlok,
      alamat: ulokData.alamat,
      approval_status: ulokData.approval_status,
      created_at: ulokData.tanggalUlok,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-[1px_1px_6px_rgba(0,0,0,0.25)] mb-8">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <MapPin className="text-red-500 mr-3" size={20} />
          <h2 className="text-lg font-semibold text-gray-900">Peta Lokasi</h2>
        </div>
      </div>
      <div className="p-6">
        <div className="w-full h-80 rounded-lg overflow-hidden border">
          <PetaLoader
            // Berikan data dalam bentuk array
            data={markerData}
            centerPoint={[Number(latitude), Number(longitude)]}
            showPopup={false} // Tidak perlu popup di halaman detail
          />
        </div>
      </div>
    </div>
  );
}
