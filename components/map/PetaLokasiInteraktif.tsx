"use client";

import { useState, useEffect } from "react";
import React from "react";
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
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

const createMarkerIcon = (color: string) => {
  const markerHtml = `
    <svg viewBox="0 0 24 24" width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    </svg>`;

  return L.divIcon({
    html: markerHtml,
    className: "custom-svg-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const colorInProgress = "#F59E0B";
const colorApprove = "#22C55E";
const colorReject = "#EF4444";
const colorWaiting = "#3B82F6";
const colorNeedInput = "#6B7280";

const inProgressIcon = createMarkerIcon(colorInProgress);
const approveIcon = createMarkerIcon(colorApprove);
const rejectIcon = createMarkerIcon(colorReject);
const waitingForForumIcon = createMarkerIcon(colorWaiting);
const needInputIcon = createMarkerIcon(colorNeedInput);

// Fix untuk ikon default (biru)
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
    "Waiting for Forum": "bg-blue-100 text-blue-800",
    "Need Input": "bg-gray-100 text-gray-800",
  };
  const style = badgeStyles[status] || "bg-gray-100 text-gray-800";

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

  // const handleDetailClick = (id: string | number, type: "ulok" | "kplt") => {
  //   const path =
  //     type === "kplt" ? "/form-kplt/detail/" : "/usulan_lokasi/detail/";
  //   router.push(`${path}${id}`);
  // };

  // --- INI ADALAH BAGIAN DIAGNOSIS UTAMA ---
  const handleDetailClick = (lokasi: Properti) => {
    // Tampilkan seluruh isi objek 'lokasi' ke console saat tombol diklik
    console.log("DIKLIK! ISI OBJEK LOKASI:", lokasi);

    // Setelah melihat console, kita akan tahu mengapa navigasi gagal
    const path = lokasi.type === 'kplt' ? '/form_kplt/detail/' : '/usulan_lokasi/detail/';
    router.push(`${path}${lokasi.id}`);
  };

  if (isLoading || !isClient) {
    return (
      <div className="h-full w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Memuat Peta...</p>
      </div>
    );
  }

  const mapCenter: [number, number] = centerPoint || [-6.25, 106.65];
  const zoomLevel = centerPoint ? 15 : 13;
  const validData = Array.isArray(data) ? data : [];

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
      <MarkerClusterGroup>
        {validData
          .filter((lokasi) => lokasi.latitude && lokasi.longitude)
          .map((lokasi, index) => {
            const lat = parseFloat(lokasi.latitude);
            const lng = parseFloat(lokasi.longitude);

            if (isNaN(lat) || isNaN(lng)) return null;

            let markerIcon;
            switch (lokasi.approval_status) {
              case "Approve":
              case "OK":
                markerIcon = approveIcon;
                break;
              case "In Progress":
                markerIcon = inProgressIcon;
                break;
              case "Reject":
              case "NOK":
                markerIcon = rejectIcon;
                break;
              case "Waiting for Forum":
                markerIcon = waitingForForumIcon;
                break;
              case "need input":
                markerIcon = needInputIcon;
                break;
              default:
                markerIcon = needInputIcon;
            }

            return (
              // FIX: Sintaks key diperbaiki menggunakan template literal di dalam kurung kurawal
              <Marker
                key={`${lokasi.id}-${index}`}
                position={[lat, lng]}
                icon={markerIcon}
              >
                {showPopup && (
                  <Popup>
                    <div className="w-64 p-3 space-y-2">
                      <h3 className="font-extrabold text-xl text-gray-800">
                        {lokasi.nama || lokasi.nama_ulok}
                      </h3>
                      <p
                        className="text-sm text-gray-600 truncate"
                        title={lokasi.alamat}
                      >
                        {lokasi.alamat}
                      </p>
                      <div className="border-b border-gray-200 pt-1"></div>
                      <div className="flex justify-between items-center gap-2 pt-1">
                        <StatusBadge status={lokasi.approval_status} />
                        <span className="text-sm font-medium text-gray-500 text-right truncate">
                          {formatTanggal(lokasi.created_at)}
                        </span>
                      </div>
                      <button
                        onClick={() =>
                          handleDetailClick(lokasi)
                        }
                        className="w-full mt-2 !ml-0 bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Lihat Detail
                      </button>
                    </div>
                  </Popup>
                )}
              </Marker>
            );
          })}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
