// components/ui/DetailMapCard.tsx
"use client";

import { useMemo } from "react";
import PetaLoader from "@/components/map/PetaLoader";
import { MapPin } from "lucide-react";

interface DetailMapCardProps {
  latlong: string; // Menerima latlong dalam format "latitude,longitude"
}

export default function DetailMapCard({ latlong }: DetailMapCardProps) {
  // Parsing latlong string menjadi angka
  const coordinates = useMemo(() => {
    if (!latlong || !latlong.includes(",")) {
      // Jika data tidak valid, kembalikan null atau default
      return null;
    }
    const [lat, lng] = latlong.split(",").map(Number);
    if (isNaN(lat) || isNaN(lng)) {
      return null;
    }
    return [lat, lng] as [number, number];
  }, [latlong]);

  // Jika koordinat tidak valid, tampilkan pesan
  if (!coordinates) {
    return (
      <div className="bg-gray-100 h-64 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">
          Koordinat lokasi tidak valid atau belum tersedia.
        </p>
      </div>
    );
  }

  // Objek data dummy yang dibutuhkan oleh PetaLoader
  const lokasiData = {
    id: 1, // ID bisa apa saja karena tidak ditampilkan
    latitude: coordinates[0],
    longitude: coordinates[1],
    // Properti lain bisa diisi data kosong
    nama: "Lokasi Usulan",
    alamat: "",
    status: "In Progress" as const,
    gambar_url: "",
    tanggal_pengajuan: "",
    harga: 0,
    luas_tanah: 0,
    luas_bangunan: 0,
    specialist_name: "",
  };

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
            data={[lokasiData]} // Berikan data dalam bentuk array
            centerPoint={coordinates}
            showPopup={false} // Tidak perlu popup di halaman detail
          />
        </div>
      </div>
    </div>
  );
}
