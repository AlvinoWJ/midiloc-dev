"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  useMapEvents
} from "react-leaflet";
import { Properti, MapPoint } from "@/types/common";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRouter } from "next/navigation";
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

// Perbaiki icon default leaflet
// @ts-expect-error leaflet internals
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const StatusBadge = ({ status }: { status: string }) => {
  const badgeStyles: Record<string, string> = {
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

const formatTanggal = (tanggalString?: string | null) => {
  if (!tanggalString) return "Tanggal tidak tersedia";
  const d = new Date(tanggalString);
  if (Number.isNaN(d.getTime())) return "Format tanggal salah";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export interface PetaProps {
  data: Array<Properti | MapPoint> | undefined;
  isLoading?: boolean;
  centerPoint?: [number, number];
  showPopup?: boolean;
  onBoundsChange?: (bounds: {
    south: number;
    west: number;
    north: number;
    east: number;
  }) => void;
  statusFilter?: string[];
  activeMapFilter?: "ulok" | "kplt"; // e.g. ["OK"] atau undefined (semua)
}

export default function PetaLokasiInteraktif({
  data,
  isLoading,
  centerPoint,
  showPopup = true,
  onBoundsChange,
  statusFilter,
  activeMapFilter
}: PetaProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const mapRef = useRef<L.Map>(null);

  useEffect(() => setIsClient(true), []);

  const points = useMemo(() => {
  const rows = Array.isArray(data) ? data : [];
  const allowed =
    statusFilter && statusFilter.length > 0 ? new Set(statusFilter) : null;

  const parsed = rows
    .map((row: any) => {
      const rawLat = row.lat ?? row.latitude ?? null;
      const rawLng = row.lng ?? row.longitude ?? null;
      const lat =
        rawLat != null ? parseFloat(String(rawLat).replace(",", ".")) : NaN;
      const lng =
        rawLng != null ? parseFloat(String(rawLng).replace(",", ".")) : NaN;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      let status: string = row.status ?? row.approval_status ?? "In Progress";
      if (status === "Approve") status = "OK";
      if (status === "Reject") status = "NOK";
      if (allowed && !allowed.has(status)) return null;

      const name: string =
        row.name ?? row.nama ?? row.nama_ulok ?? row.nama_kplt ?? "Lokasi";
      const created_at: string | undefined = row.created_at ?? undefined;
      const alamat: string | undefined = row.alamat ?? undefined;

        const type: "ulok" | "kplt" =
  (row.type === "kplt" ||
    row.nama_kplt ||
    row.kode_kplt ||
    activeMapFilter === "kplt")
    ? "kplt"
    : "ulok";


      const id = String(row.id);

      return { id, lat, lng, status, name, created_at, alamat, type };
    })
    .filter(Boolean) as Array<{
      id: string;
      lat: number;
      lng: number;
      status: string;
      name: string;
      created_at?: string;
      alamat?: string;
      type: "ulok" | "kplt";
    }>;
  // 💡 Pastikan KPLT selalu digambar terakhir agar tidak tertimpa marker ULOK
  return [
    ...parsed.filter((p) => p.type === "ulok"),
    ...parsed.filter((p) => p.type === "kplt"),
  ];
}, [data, statusFilter]);



  // --- PERBAIKAN 1: Buat Komponen Event Handler ---
  // Komponen ini harus berada di dalam MapContainer untuk mengakses peta
  function MapEventsHandler() {
    const map = useMapEvents({
      // Event saat peta selesai bergerak
      moveend: () => {
        const b = map.getBounds();
        onBoundsChange?.({
          south: b.getSouth(),
          west: b.getWest(),
          north: b.getNorth(),
          east: b.getEast(),
        });
      },
      // Event saat zoom selesai
      zoomend: () => {
        const b = map.getBounds();
        onBoundsChange?.({
          south: b.getSouth(),
          west: b.getWest(),
          north: b.getNorth(),
          east: b.getEast(),
        });
      },
    });
    
    // Set ref peta secara manual (opsional, jika whenReady tidak cukup)
    // @ts-ignore // Abaikan error type casting jika muncul
    mapRef.current = map;

    return null; // Komponen ini tidak merender UI
  }

  if (isLoading || !isClient) {
     return (
      <div className="h-full w-full bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Memuat Peta...</p>
      </div>
    );
  }

  const mapCenter: [number, number] =
    centerPoint ??
    (points[0] ? [points[0].lat, points[0].lng] : [-6.25, 106.65]);
  const zoomLevel = centerPoint ? 15 : 13;

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoomLevel}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
       ref={mapRef}

      // whenReady masih bisa digunakan untuk mendapatkan bounds awal
      whenReady={() => {
        // Beri jeda sedikit agar ref ter-set oleh MapEventsHandler
        setTimeout(() => {
          if (mapRef.current) {
            const b = mapRef.current.getBounds();
            onBoundsChange?.({
              south: b.getSouth(),
              west: b.getWest(),
              north: b.getNorth(),
              east: b.getEast(),
            });
          }
        }, 100); 
      }}
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
      <MapEventsHandler />

      <MarkerClusterGroup showCoverageOnHover={false} maxClusterRadius={60}>
        {points.map((p, index) => {
          const icon =
            p.status === "OK"
              ? approveIcon
              : p.status === "NOK"
              ? rejectIcon
              : p.status === "In Progress"
              ? inProgressIcon
              : p.status === "Waiting for Forum"
              ? waitingForForumIcon
              : needInputIcon;

          return (
            <Marker
              key={`${p.id}-${index}`}
              position={[p.lat, p.lng]}
              icon={icon}
            >
              {showPopup && (
                <Popup>
                  <div className="w-64 p-3 space-y-2">
                    <h3 className="font-extrabold text-xl text-gray-800">
                      {p.name}
                    </h3>
                    {p.alamat ? (
                      <p
                        className="text-sm text-gray-600 truncate"
                        title={p.alamat}
                      >
                        {p.alamat}
                      </p>
                    ) : null}
                    <div className="border-b border-gray-200 pt-1"></div>
                    <div className="flex justify-between items-center gap-2 pt-1">
                      <StatusBadge status={p.status} />
                      <span className="text-sm font-medium text-gray-500 text-right truncate">
                        {formatTanggal(p.created_at)}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        const path =
                    p.type === "kplt"
                      ? `/form_kplt/detail/${p.id}`
                      : `/usulan_lokasi/detail/${p.id}`;
                  router.push(path);
                }}
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
