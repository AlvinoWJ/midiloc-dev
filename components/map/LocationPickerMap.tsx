// components/map/LocationPickerMap.tsx
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLng } from "leaflet";

// Fix ikon default Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Props untuk komponen utama
interface LocationPickerMapProps {
  onConfirm: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({
  onConfirm,
}: LocationPickerMapProps) {
  const defaultCenter: [number, number] = [-6.2, 106.81];
  const [position, setPosition] = useState<LatLng>(
    new LatLng(defaultCenter[0], defaultCenter[1])
  );
  const markerRef = useRef<L.Marker>(null);
  const mapRef = useRef<L.Map>(null);

  // --- KOMPONEN INTERNAL DIDEFINISIKAN DI SINI DENGAN SINTAKS BENAR ---

  // Komponen untuk me-refresh ukuran peta
  const MapRefresher = () => {
    const map = useMap();
    useEffect(() => {
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }, [map]);
    return null; // Wajib mengembalikan null
  };

  // Komponen untuk menangani klik pada peta
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setPosition(e.latlng);
      },
    });
    return null; // Wajib mengembalikan null
  };

  // -----------------------------------------------------------------

  // Efek untuk mendapatkan lokasi pengguna saat ini
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (location) => {
          const userLatLng = new LatLng(
            location.coords.latitude,
            location.coords.longitude
          );
          setPosition(userLatLng);
          if (mapRef.current) {
            mapRef.current.flyTo(userLatLng, 15);
          }
        },
        (error) => {
          console.warn("Gagal mendapatkan lokasi pengguna:", error.message);
        }
      );
    }
  }, []);

  // Event handler untuk marker yang bisa digeser
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          setPosition(marker.getLatLng());
        }
      },
    }),
    []
  );

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={defaultCenter}
        zoom={11}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <Marker
          draggable={true}
          eventHandlers={eventHandlers}
          position={position}
          ref={markerRef}
        />

        {/* Panggil komponen internal yang sudah benar */}
        <MapClickHandler />
        <MapRefresher />
      </MapContainer>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
        <button
          onClick={() => onConfirm(position.lat, position.lng)}
          className="bg-red-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-red-700 transition-colors"
        >
          Pilih Lokasi Ini
        </button>
      </div>
    </div>
  );
}
