export interface LatLng {
  lat: number
  lng: number
}

export interface RoutePoint extends LatLng {
  id: string
}

const EARTH_RADIUS_KM = 6371

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

// Ordena los puntos con la heurística del vecino más cercano partiendo de
// "start": el más cercano a mi ubicación primero, luego el siguiente, etc.
// En lugar de la distancia real por carretera se usa la distancia en línea
// recta (Haversine), suficiente para optimizar una ruta de visita/entrega.
export function computeBestRoute(start: LatLng, points: RoutePoint[]): string[] {
  const remaining = [...points]
  const order: string[] = []
  let current: LatLng = start

  while (remaining.length > 0) {
    let bestIndex = 0
    let bestDistance = Infinity
    for (let i = 0; i < remaining.length; i++) {
      const distance = haversineKm(current, remaining[i])
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = i
      }
    }
    order.push(remaining[bestIndex].id)
    current = remaining[bestIndex]
    remaining.splice(bestIndex, 1)
  }

  return order
}

// Punto central de un conjunto (fallback si no hay ubicación GPS disponible).
export function centroid(points: LatLng[]): LatLng {
  if (points.length === 0) return { lat: 12.8654, lng: -85.2072 }
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  )
  return { lat: sum.lat / points.length, lng: sum.lng / points.length }
}

// Ubicación actual del dispositivo (GPS del navegador). Devuelve null si no
// hay soporte, el permiso fue denegado o expiró el timeout.
export function getCurrentPosition(): Promise<LatLng | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000, maximumAge: 300_000, enableHighAccuracy: true },
    )
  })
}