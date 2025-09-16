// components/map/PetaLokasiInteraktif.tsx
"use client";

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
import { useProperti } from "@/hooks/useProperty";
import { Properti } from "@/types/common"; // 1. Tipe data diaktifkan (uncomment)

// Fix ikon default Leaflet (tidak berubah)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

const StatusBadge = ({ status }: { status: string }) => {
  const badgeStyles: { [key: string]: string } = {
    "In Progress": "bg-yellow-100 text-yellow-800",
    OK: "bg-green-100 text-green-800",
    NOK: "bg-red-100 text-red-800",
  };
  const style = badgeStyles[status] || "bg-gray-100 text-gray-800"; // Default style

  return (
    <span
      className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 ${style}`}
    >
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
  centerPoint?: [number, number];
  showPopup?: boolean;
}

export default function PetaLokasiInteraktif({
  centerPoint,
  showPopup = true,
}: PetaProps) {
  const router = useRouter();
  const { properti, isLoading, isError } = useProperti();

  const handleDetailClick = (id: string | number) => {
    router.push(`/usulan_lokasi/detail/${id}`);
  };

  // 2. Penanganan state saat data sedang dimuat (loading)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-lg text-gray-500">Memuat data lokasi...</p>
      </div>
    );
  }

  // 3. Penanganan state jika terjadi kesalahan (error)
  if (isError) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-lg text-red-500">Gagal memuat data.</p>
      </div>
    );
  }

  const mapCenter: [number, number] = centerPoint || [-6.25, 106.65]; // Default Tangerang Selatan
  const zoomLevel = centerPoint ? 15 : 13;

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoomLevel}
      style={{ height: "100%", width: "100%", zIndex: 0 }} // zIndex ditambahkan untuk menghindari konflik
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Peta Jalan">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Citra Satelit">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {properti
        .filter((lokasi) => lokasi.status !== "NOK") // Filter data dengan status BUKAN 'NOK'
        .map(
          (
            lokasi // 4. Variabel diubah menjadi 'lokasi' agar lebih jelas
          ) => (
            <Marker
              key={lokasi.id}
              position={[lokasi.latitude, lokasi.longitude]}
            >
              {showPopup && (
                <Popup>
                  <div className="w-64 p-3 space-y-2">
                    <h3 className="font-extrabold text-xl text-gray-800">
                      {lokasi.nama}
                    </h3>
                    <p
                      className="text-sm text-gray-600 truncate"
                      title={lokasi.alamat}
                    >
                      {lokasi.alamat}
                    </p>
                    <div className="border-b border-gray-200 pt-1"></div>
                    <div className="flex justify-between items-center gap-2 pt-1">
                      <StatusBadge status={lokasi.status} />
                      <span className="text-sm font-medium text-gray-500 text-right truncate">
                        {formatTanggal(lokasi.tanggal_pengajuan)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDetailClick(lokasi.id)}
                      className="w-full mt-2 !ml-0 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Lihat Detail
                    </button>
                  </div>
                </Popup>
              )}
            </Marker>
          )
        )}
    </MapContainer>
  );
}
