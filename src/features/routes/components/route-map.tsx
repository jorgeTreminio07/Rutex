"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2Icon, MapPinOffIcon, NavigationIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getCurrentPosition } from "@/features/routes/lib/route-path"
import type { LatLng, RoutePoint } from "@/features/routes/lib/route-path"

const NICARAGUA_CENTER: [number, number] = [12.8654, -85.2072]

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
}

// Mapa de la ruta. Los puntos vienen YA ordenados según la mejor ruta guardada
// al crear (visit_order). Para poder trazar la ruta se requiere la ubicación
// actual del dispositivo: sin GPS no se puede ver el mapa.
export function RouteMapDialog({ open, onOpenChange, routeCode, points }: RouteMapDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [start, setStart] = useState<LatLng | null | undefined>(undefined)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!open || points.length === 0) return
    let cancelled = false
    void getCurrentPosition().then((pos) => {
      if (!cancelled) setStart(pos)
    })
    return () => {
      cancelled = true
    }
  }, [open, points, retryKey])

  useEffect(() => {
    if (!open || points.length === 0) return
    if (!start || typeof start.lat !== "number" || typeof start.lng !== "number") return

    let active = true
    let map: ReturnType<typeof import("leaflet").map> | null = null
    const origin = start

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

        const latlngs: [number, number][] = [
          [origin.lat, origin.lng],
          ...points.map((p) => [p.lat, p.lng] as [number, number]),
        ]

        leaflet.marker([origin.lat, origin.lng], { icon: startIcon(leaflet) }).addTo(localMap)
        leaflet
          .polyline(latlngs, { color: "#0d9488", weight: 4, opacity: 0.8 })
          .addTo(localMap)
        points.forEach((p, index) => {
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
  }, [open, points, start])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle>Mapa de la ruta {routeCode}</DialogTitle>
          <DialogDescription>
            Ruta trazada desde tu ubicación en el orden de la mejor ruta guardada.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 px-6 pb-4">
          {points.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              Ningún cliente de la ruta tiene ubicación en el mapa.
            </p>
          ) : start === null ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed p-10 text-center">
              <MapPinOffIcon className="size-8 text-destructive" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Necesitamos tu ubicación para poder ver el mapa. Enciende la localización del
                dispositivo y acepta el permiso del navegador, luego reintenta.
              </p>
              <Button type="button" variant="outline" onClick={() => setRetryKey((k) => k + 1)}>
                <NavigationIcon /> Reintentar
              </Button>
            </div>
          ) : start === undefined ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
              <Loader2Icon className="size-5 animate-spin text-emerald-600" />
              Obteniendo tu ubicación…
            </div>
          ) : (
            <div className="relative h-[60vh] w-full overflow-hidden rounded-xl">
              <div ref={containerRef} className="h-full w-full" />
              <div className="pointer-events-none absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-lg bg-background/90 px-2.5 py-1.5 text-xs shadow">
                <NavigationIcon className="size-3.5 text-emerald-600" />
                Inicio: tu ubicación
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