"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  LayersControl,
  useMapEvents,
} from "react-leaflet";
import { Properti, MapPoint } from "@/types/common";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useRouter } from "next/navigation";
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// --- Utility untuk membuat ikon marker ---
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

// --- Peta warna status (sudah dibedakan warna progress KPLT) ---
const STATUS_COLOR_MAP: Record<string, string> = {
  // Status ULOK/KPLT
  "In Progress": "#F59E0B", // Kuning
  OK: "#22C55E", // Hijau
  Approve: "#22C55E",
  NOK: "#EF4444", // Merah
  Reject: "#EF4444",
  "Waiting for Forum": "#3B82F6", // Biru
  "Need Input": "#6B7280", // Abu-abu

  // Status Progress KPLT (warna dibedakan)
  "Not Started": "#6B7280", // Abu-abu
  Mou: "#3B82F6", // Biru
  "Izin Tetangga": "#60A5FA", // Biru muda
  Perizinan: "#FBBF24", // Kuning
  Notaris: "#8B5CF6", // Ungu
  Renovasi: "#EC4899", // Pink
  "Grand Opening": "#22C55E", // Hijau

  // Default
  default: "#9CA3AF",
};

// --- Cache Icon untuk efisiensi ---
const iconCache: Record<string, L.DivIcon> = {};
const getMarkerIcon = (status: string): L.DivIcon => {
  const statusNormalized = status || "default";
  const color =
    STATUS_COLOR_MAP[statusNormalized] || STATUS_COLOR_MAP["default"];
  if (!iconCache[color]) {
    iconCache[color] = createMarkerIcon(color);
  }
  return iconCache[color];
};

// --- Fix default leaflet icon path ---
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// --- Komponen StatusBadge ---
const StatusBadge = ({ status }: { status: string }) => {
  const badgeStyles: Record<string, string> = {
    // Status Umum
    "In Progress": "bg-yellow-100 text-yellow-800",
    OK: "bg-green-100 text-green-800",
    Approve: "bg-green-100 text-green-800",
    NOK: "bg-red-100 text-red-800",
    Reject: "bg-red-100 text-red-800",
    "Waiting for Forum": "bg-blue-100 text-blue-800",
    "Need Input": "bg-gray-100 text-gray-800",

    // Status Progress KPLT (dibedakan)
    "Not Started": "bg-gray-100 text-gray-800",
    Mou: "bg-blue-100 text-blue-800",
    "Izin Tetangga": "bg-blue-100 text-blue-800",
    Perizinan: "bg-yellow-100 text-yellow-800",
    Notaris: "bg-purple-100 text-purple-800",
    Renovasi: "bg-pink-100 text-pink-800",
    "Grand Opening": "bg-green-100 text-green-800",
  };
  const style = badgeStyles[status] || "bg-gray-100 text-gray-800";

  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${style}`}>
      {status}
    </span>
  );
};

// --- Fungsi Format Tanggal ---
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

// --- Komponen Utama ---
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
  activeMapFilter?: "ulok" | "kplt" | "progress_kplt";
}

export default function PetaLokasiInteraktif({
  data,
  isLoading,
  centerPoint,
  showPopup = true,
  onBoundsChange,
  statusFilter,
  activeMapFilter,
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

        const type = (row.type || activeMapFilter) as
          | "ulok"
          | "kplt"
          | "progress_kplt";
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
      type: "ulok" | "kplt" | "progress_kplt";
    }>;

    return parsed;
  }, [data, statusFilter, activeMapFilter]);

  function MapEventsHandler() {
    const map = useMapEvents({
      moveend: () => {
        const b = map.getBounds();
        onBoundsChange?.({
          south: b.getSouth(),
          west: b.getWest(),
          north: b.getNorth(),
          east: b.getEast(),
        });
      },
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

    mapRef.current = map;
    return null;
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
      whenReady={() => {
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
          const icon = getMarkerIcon(p.status);
          return (
            <Marker
              key={`${p.id}-${index}`}
              position={[p.lat, p.lng]}
              icon={icon}
            >
              {showPopup && (
                <Popup>
                  <div className="w-64 p-2 flex flex-col gap-1">
                    <h3 className="font-bold text-lg text-gray-800 leading-tight">
                      {p.name}
                    </h3>

                    {p.alamat && (
                      <p
                        className="text-xs text-gray-600 truncate"
                        title={p.alamat}
                      >
                        {p.alamat}
                      </p>
                    )}

                    <div className="border-b border-gray-200 my-1"></div>

                    <div className="flex justify-between items-center">
                      <StatusBadge status={p.status} />
                      <span className="text-xs text-gray-500 text-right">
                        {formatTanggal(p.created_at)}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const path =
                          p.type === "kplt"
                            ? `/form_kplt/detail/${p.id}`
                            : p.type === "progress_kplt"
                            ? `/progress_kplt/detail/${p.id}`
                            : `/usulan_lokasi/detail/${p.id}`;
                        router.push(path);
                      }}
                      className="w-full mt-2 bg-blue-600 text-white text-sm font-semibold py-1.5 rounded-md hover:bg-blue-700 transition-colors"
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
