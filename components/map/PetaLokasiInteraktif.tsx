// components/map/PetaLokasiInteraktif.tsx
"use client";

import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRouter } from "next/navigation";
import { Properti } from "@/types/common";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// FIX: Komponen StatusBadge diperbaiki dan disatukan
const StatusBadge = ({ status }: { status: Properti["approval_status"] }) => {
  const badgeStyles: { [key: string]: string } = {
    "In Progress": "bg-yellow-100 text-yellow-800",
    OK: "bg-green-100 text-green-800",
    NOK: "bg-red-100 text-red-800",
  };
  const style = badgeStyles[status] || "bg-gray-100 text-gray-800";

  return (
    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${style}`}>
      {status}
    </span>
  );
};

const formatTanggal = (tanggalString: string | undefined | null) => {
  if (!tanggalString) return "Tanggal tidak tersedia";
  try {
    return new Date(tanggalString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    return "Format tanggal salah";
  }
};

interface PetaProps {
  data: Properti[] | undefined;
  isLoading?: boolean;
  centerPoint?: [number, number];
  showPopup?: boolean;
}

export default function PetaLokasiInteraktif({
  data,
  isLoading,
  centerPoint,
  showPopup = true,
}: PetaProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDetailClick = (id: string | number) => {
    // FIX: Menggunakan backticks (`) untuk template literal
    router.push(`/usulan_lokasi/detail/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100 rounded-lg">
        <p className="text-lg text-gray-500">Memuat data lokasi...</p>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="h-full w-full bg-gray-200 animate-pulse rounded-lg" />
    );
  }

  const mapCenter: [number, number] = centerPoint || [-6.25, 106.65]; // Default: Tangerang Area
  const zoomLevel = 13;

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoomLevel}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      <LayersControl position="topright">
        {/* FIX: LayersControl diperbaiki dengan dua layer yang valid */}
        <LayersControl.BaseLayer checked name="Peta Jalan">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Peta Satelit">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {data &&
        data
          .filter(
            (lokasi) =>
              lokasi.latitude &&
              lokasi.longitude &&
              lokasi.approval_status !== "NOK"
          )
          .map((lokasi) => {
            const lat = parseFloat(lokasi.latitude);
            const lng = parseFloat(lokasi.longitude);

            if (isNaN(lat) || isNaN(lng)) {
              return null; // Lewati data dengan koordinat tidak valid
            }

            return (
              <Marker key={lokasi.id} position={[lat, lng]}>
                {showPopup && (
                  <Popup>
                    <div className="w-64 p-1 space-y-2">
                      <h3 className="font-bold text-base text-gray-800">
                        {lokasi.nama_ulok}
                      </h3>
                      <p
                        className="text-xs text-gray-600 truncate"
                        title={lokasi.alamat}
                      >
                        {lokasi.alamat}
                      </p>
                      <div className="border-b border-gray-200 pt-1"></div>
                      <div className="flex justify-between items-center gap-2 pt-1">
                        <StatusBadge status={lokasi.approval_status} />
                        <span className="text-xs font-medium text-gray-500 text-right truncate">
                          {formatTanggal(lokasi.created_at)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDetailClick(lokasi.id)}
                        className="w-full mt-2 !ml-0 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Lihat Detail
                      </button>
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}
    </MapContainer>
  );
}
