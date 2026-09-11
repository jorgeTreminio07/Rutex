"use client"

import { useEffect, useRef } from "react"
import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { centroid, computeBestRoute } from "@/features/routes/lib/route-path"
import type { RoutePoint } from "@/features/routes/lib/route-path"

const NICARAGUA_CENTER: [number, number] = [12.8654, -85.2072]

function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
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

function startIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:9999px;background:#16a34a;color:#fff;font-weight:800;font-size:10px;letter-spacing:.04em;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35)">INICIO</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

function clientIcon(L: typeof import("leaflet"), index: number) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:9999px;background:#0d9488;color:#fff;font-weight:700;font-size:13px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)">${index}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

interface RouteMapDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  routeCode: string
  points: RoutePoint[]
  onOrdered?: (orderedIds: string[]) => void
}

// Mapa de la ruta: el orden se calcula con vecino más cercano desde mi
// ubicación (GPS), con la distancia en línea recta (Haversine).
export function RouteMapDialog({
  open,
  onOpenChange,
  routeCode,
  points,
  onOrdered,
}: RouteMapDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onOrderedRef = useRef(onOrdered)
  useEffect(() => {
    onOrderedRef.current = onOrdered
  }, [onOrdered])

  useEffect(() => {
    if (!open || points.length === 0) return

    let active = true
    let map: ReturnType<typeof import("leaflet").map> | null = null

    async function mount() {
      try {
        const leaflet = await import("leaflet")
        const container = containerRef.current
        if (!active || !container || !container.isConnected) return
        if ((container as unknown as { _leaflet_id?: unknown })._leaflet_id) return

        const localMap = leaflet.map(container, {
          center: NICARAGUA_CENTER,
          zoom: 8,
          scrollWheelZoom: true,
        })
        map = localMap
        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap",
          })
          .addTo(localMap)

        const start = (await getCurrentPosition()) ?? centroid(points)
        if (!active || !container.isConnected) {
          localMap.remove()
          map = null
          return
        }

        const orderedIds = computeBestRoute(start, points)
        onOrderedRef.current?.(orderedIds)

        const pointsById = new Map(points.map((p) => [p.id, p]))
        const orderedPoints = orderedIds
          .map((id) => pointsById.get(id))
          .filter((p): p is RoutePoint => Boolean(p))

        const latlngs: [number, number][] = [
          [start.lat, start.lng],
          ...orderedPoints.map((p) => [p.lat, p.lng] as [number, number]),
        ]

        leaflet.marker([start.lat, start.lng], { icon: startIcon(leaflet) }).addTo(localMap)
        leaflet
          .polyline(latlngs, { color: "#0d9488", weight: 4, opacity: 0.8 })
          .addTo(localMap)
        orderedPoints.forEach((p, index) => {
          leaflet
            .marker([p.lat, p.lng], { icon: clientIcon(leaflet, index + 1) })
            .addTo(localMap)
        })

        localMap.fitBounds(latlngs, { padding: [48, 48] })
        window.setTimeout(() => localMap.invalidateSize(), 150)
      } catch (error) {
        console.error("Error al montar el mapa de la ruta:", error)
      }
    }

    void mount()
    return () => {
      active = false
      map?.remove()
      map = null
    }
  }, [open, points])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle>Mapa de la ruta {routeCode}</DialogTitle>
          <DialogDescription>
            Ruta desde tu ubicación al cliente más cercano, hasta el más lejano.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 px-6 pb-4">
          {points.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Ningún cliente de la ruta tiene ubicación en el mapa.
            </p>
          ) : (
            <div className="relative h-[60vh] w-full overflow-hidden rounded-xl">
              <div ref={containerRef} className="h-full w-full" />
              <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-lg bg-background/90 px-2.5 py-1.5 text-xs shadow">
                <Loader2Icon className="size-3.5 animate-pulse text-emerald-600" />
                Calculando mejor ruta…
              </div>
            </div>
          )}
        </div>
        <div className="flex shrink-0 justify-end border-t bg-muted/50 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}