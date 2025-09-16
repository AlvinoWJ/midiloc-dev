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
import { Properti } from "@/types/common";
import { useRouter } from "next/navigation";

// Fix ikon default Leaflet (tidak berubah)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// --- BAGIAN YANG DIPERBAIKI ---
// Komponen StatusBadge didefinisikan dengan benar di sini.
// Kita tambahkan 'return' dan kurung kurawal yang benar.
const StatusBadge = ({ status }: { status: Properti["status"] }) => {
  const badgeStyles = {
    "In Progress": "bg-yellow-100 text-yellow-800",
    OK: "bg-green-100 text-green-800",
    NOK: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`px-3 py-1 text-sm font-semibold rounded-full flex-shrink-0 ${badgeStyles[status]}`}
    >
      {status}
    </span>
  );
};
// --- AKHIR DARI PERBAIKAN ---

const formatTanggal = (tanggalString: string) => {
  if (!tanggalString) return "Tanggal tidak tersedia";
  try {
    // Mengubah string tanggal ISO menjadi format yang lebih ramah
    return new Date(tanggalString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    return "Format tanggal salah";
  }
};

// Interface props dipindahkan ke atas agar lebih rapi
interface PetaProps {
  data: Properti[];
  centerPoint?: [number, number];
  showPopup?: boolean;
}

export default function PetaLokasiInteraktif({
  data,
  centerPoint,
  showPopup = true,
}: PetaProps) {
  const router = useRouter();

  const handleDetailClick = (id: number) => {
    router.push(`/usulan_lokasi/detail/${id}`);
  };

  const mapCenter: [number, number] = centerPoint || [-6.25, 106.65];
  const zoomLevel = centerPoint ? 15 : 13;

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoomLevel}
      style={{ height: "100%", width: "100%" }}
    >
      <LayersControl position="topright">
        {/* Kontrol Layer tidak berubah */}
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

      {data
        .filter((lokasi) => lokasi.status !== "NOK") // Saring data yang statusnya BUKAN 'NOK'
        .map((lokasi) => (
          <Marker
            key={lokasi.id}
            position={[lokasi.latitude, lokasi.longitude]}
          >
            {/* Logika untuk menampilkan/menyembunyikan Popup tidak berubah */}
            {showPopup && (
              <Popup>
                <div className="w-64 p-3 space-y-2">
                  <h3 className="font-extrabold text-xl text-gray-800">
                    {lokasi.nama}
                  </h3>

                  {/* 'truncate' akan memotong teks alamat jika terlalu panjang */}
                  <p className="text-sm text-gray-600 truncate">
                    {lokasi.alamat}
                  </p>

                  <div className="border-b border-gray-200 pt-1"></div>

                  {/* Bagian Status dan Tanggal dengan Flexbox */}
                  <div className="flex justify-between items-center gap-2 pt-1">
                    <StatusBadge status={lokasi.status} />
                    {/* Panggil fungsi formatTanggal di sini */}
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
        ))}
    </MapContainer>
  );
}
