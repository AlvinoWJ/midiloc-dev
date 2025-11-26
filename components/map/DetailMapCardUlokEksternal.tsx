"use client";

import { useState } from "react";
import PetaLoader from "@/components/map/PetaLoader";
import { MapPin } from "lucide-react";
import { Properti } from "@/types/common";

interface DetailMapCardProps {
  id: string;
  latitude: number | null | undefined;
  longitude: number | null | undefined;
}

export default function DetailMapCard({
  id,
  latitude,
  longitude,
}: DetailMapCardProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // --- ISI KEMBALI FUNGSI INI ---
  const handleRouteClick = () => {
    if (!latitude || !longitude) {
      alert("Koordinat tujuan tidak tersedia.");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: userLat, longitude: userLng } = position.coords;
        const googleMapsUrl = `https://www.google.com/maps/dir/${userLat},${userLng}/${latitude},${longitude}`;
        window.open(googleMapsUrl, "_blank");

        setIsGettingLocation(false);
      },
      (error) => {
        console.error("Geolocation Error:", error.message);
        alert(
          "Gagal mendapatkan lokasi Anda. Pastikan izin lokasi telah diberikan."
        );
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        window.open(fallbackUrl, "_blank");
        setIsGettingLocation(false);
      }
    );
  };
  // --- AKHIR DARI PERBAIKAN FUNGSI ---

  if (
    !latitude ||
    !longitude ||
    isNaN(Number(latitude)) ||
    isNaN(Number(longitude))
  ) {
    return (
      <div className="bg-white rounded-xl shadow-md mb-8 p-6 h-64 flex items-center justify-center">
        <p className="text-gray-500">
          Koordinat lokasi tidak valid atau tidak tersedia.
        </p>
      </div>
    );
  }

  const markerData: Properti[] = [
    {
      id: id,
      latitude: latitude,
      longitude: longitude,
      nama_ulok: "Lokasi Pilihan",
      alamat: "",

      created_at: "",
      type: "ulok",
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
            data={markerData}
            centerPoint={[Number(latitude), Number(longitude)]}
            showPopup={false}
          />
        </div>

        <div className="mt-6">
          <button
            onClick={handleRouteClick} // Tombol ini sekarang memanggil fungsi yang sudah terisi
            disabled={isGettingLocation}
            className="flex items-center justify-center w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {isGettingLocation
              ? "Mencari Lokasi..."
              : "Lihat Rute di Google Maps"}
          </button>
        </div>
      </div>
    </div>
  );
}
