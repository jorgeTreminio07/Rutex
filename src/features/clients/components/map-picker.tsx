"use client"

import { useEffect, useRef } from "react"
import type { LeafletMouseEvent, Map as LeafletMap, Marker } from "leaflet"

export interface MapCoords {
  lat: number
  lng: number
}

const NICARAGUA_CENTER: [number, number] = [12.8654, -85.2072]

function buildPinIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="#0d9488" stroke="#ffffff" stroke-width="1.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#ffffff" stroke="none"/></svg>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
  })
}

interface MapPickerProps {
  value: MapCoords | null
  onPick: (coords: MapCoords) => void
  className?: string
}

export function MapPicker({ value, onPick, className }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<{
    map: LeafletMap
    marker: Marker | null
    leaflet: typeof import("leaflet")
  } | null>(null)
  const onPickRef = useRef(onPick)
  const valueRef = useRef(value)
  onPickRef.current = onPick
  valueRef.current = value

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let cancelled = false
    let timer: number | undefined

    async function mount() {
      const leaflet = await import("leaflet")
      if (cancelled || !container) return

      const initial = valueRef.current
      const map = leaflet.map(container, {
        center: initial ? [initial.lat, initial.lng] : NICARAGUA_CENTER,
        zoom: initial ? 15 : 6,
        scrollWheelZoom: false,
      })

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
        .addTo(map)

      const marker = initial
        ? leaflet.marker([initial.lat, initial.lng], { icon: buildPinIcon(leaflet) }).addTo(map)
        : null

      map.on("click", (event: LeafletMouseEvent) => {
        onPickRef.current({ lat: event.latlng.lat, lng: event.latlng.lng })
      })

      mapRef.current = { map, marker, leaflet }

      timer = window.setTimeout(() => map.invalidateSize(), 150)
    }

    void mount()

    return () => {
      cancelled = true
      const ref = mapRef.current
      if (ref) {
        if (timer) window.clearTimeout(timer)
        ref.map.remove()
        mapRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const ref = mapRef.current
    if (!ref || !value) return
    const point: [number, number] = [value.lat, value.lng]
    if (ref.marker) {
      ref.marker.setLatLng(point)
    } else {
      ref.marker = ref.leaflet.marker(point, { icon: buildPinIcon(ref.leaflet) }).addTo(ref.map)
    }
  }, [value])

  return <div ref={containerRef} className={className ?? "h-80 w-full rounded-xl"} />
}