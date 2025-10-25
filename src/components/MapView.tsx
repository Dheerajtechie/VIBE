"use client";

import dynamic from "next/dynamic";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";

type Props = {
  center: { lat: number; lon: number };
  users?: Array<{ lat: number; lon: number; id: string }>;
};

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export function MapView({ center, users = [] }: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-64 w-full overflow-hidden rounded-2xl ring-1 ring-black/5 flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full overflow-hidden rounded-2xl ring-1 ring-black/5">
      <MapContainer center={[center.lat, center.lon]} zoom={16} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution={process.env.NEXT_PUBLIC_MAP_ATTRIBUTION}
          url={process.env.NEXT_PUBLIC_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
        />
        <Marker position={[center.lat, center.lon]} icon={icon} />
        <Circle center={[center.lat, center.lon]} radius={500} pathOptions={{ color: "#8B5CF6", opacity: 0.3 }} />
        {users.map((u) => (
          <Marker key={u.id} position={[u.lat, u.lon]} icon={icon} />
        ))}
      </MapContainer>
    </div>
  );
}
