// components/map/LocationPickerMap.tsx
'use client';

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix ikon default Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ /* ... (kode ikon sama seperti sebelumnya) */ });

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (latlng: L.LatLng) => void }) {
  useMapEvents({ click(e) { onLocationSelect(e.latlng); } });
  return null;
}

interface LocationPickerMapProps {
  onSelect: (lat: number, lng: number) => void;
}

export default function LocationPickerMap({ onSelect }: LocationPickerMapProps) {
  const [markerPosition, setMarkerPosition] = useState<L.LatLng | null>(null);

  const handleLocationSelect = (latlng: L.LatLng) => {
    setMarkerPosition(latlng);
    onSelect(latlng.lat, latlng.lng);
  };

  return (
    <MapContainer center={[-6.20, 106.81]} zoom={11} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
      {markerPosition && <Marker position={markerPosition} />}
      <MapClickHandler onLocationSelect={handleLocationSelect} />
    </MapContainer>
  );
}