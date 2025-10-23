export type GeoPoint = { lat: number; lon: number };

export async function requestLocation(options: PositionOptions = { enableHighAccuracy: true, timeout: 15000 }): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      options,
    );
  });
}

export function watchLocation(callback: (point: GeoPoint) => void, options: PositionOptions = { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 }) {
  if (!("geolocation" in navigator)) return -1;
  return navigator.geolocation.watchPosition(
    (pos) => callback({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
    () => {},
    options,
  );
}

export function clearWatch(id: number) {
  if (id >= 0 && "geolocation" in navigator) navigator.geolocation.clearWatch(id);
}

export function distanceLabel(meters: number): string {
  if (meters < 75) return "50m away";
  if (meters < 150) return "same block";
  if (meters < 300) return "2 streets over";
  if (meters < 600) return `${Math.round(meters / 100) * 100}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}


