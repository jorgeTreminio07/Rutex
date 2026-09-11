"use client"

import { ArrowLeftIcon, BanIcon, Loader2Icon, MapIcon, MapPinIcon, PhoneIcon, UserRoundIcon } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  labelForRouteStatus,
  labelForRouteType,
  type RouteClientDto,
  type RouteClientStatus,
  type RouteStatus,
} from "@/types/interfaces/route.interface"
import { nicaDateTime } from "@/features/deliveries/lib/format"
import { RouteClientDialog } from "@/features/routes/components/route-client-dialog"
import { RouteMapDialog } from "@/features/routes/components/route-map"
import { useCancelRoute, useRouteByCode } from "@/features/routes/hooks/use-routes"
import type { RoutePoint } from "@/features/routes/lib/route-path"

function clientBadge(status: RouteStatus | RouteClientStatus) {
  switch (status) {
    case "completada":
      return { variant: "outline" as const, className: "border-emerald-600/40 bg-emerald-600/10 text-emerald-700" }
    case "cancelada":
      return { variant: "destructive" as const, className: "" }
    default:
      return { variant: "outline" as const, className: "border-primary/40 text-primary" }
  }
}

function clientCardClass(status: RouteClientStatus): string {
  switch (status) {
    case "completada":
      return "border-emerald-500/50 bg-emerald-500/10"
    case "cancelada":
      return "border-red-500/60 bg-red-500/10"
    default:
      return "border-border bg-card"
  }
}

interface RouteDetailViewProps {
  code: string
}

export function RouteDetailView({ code }: RouteDetailViewProps) {
  const { data: route, isLoading, isError } = useRouteByCode(code)
  const cancelRoute = useCancelRoute(code)
  const [mapOpen, setMapOpen] = useState(false)
  const [viewingClient, setViewingClient] = useState<RouteClientDto | null>(null)

  const points = useMemo<RoutePoint[]>(
    () =>
      (route?.clients ?? [])
        .filter((c) => typeof c.latitude === "number" && typeof c.longitude === "number")
        .map((c) => ({ id: c.id, lat: c.latitude as number, lng: c.longitude as number })),
    [route],
  )

  // Los clientes vienen ordenados por visit_order, que el servidor guardó al
  // crear la ruta (la mejor ruta desde mi ubicación). No se recalcula cada vez.
  const orderedClients = route?.clients ?? []

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !route) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Button variant="ghost" nativeButton={false} render={<Link href="/rutas" />}>
          <ArrowLeftIcon /> Volver a rutas
        </Button>
        <p className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
          No se pudo cargar la ruta {code}.
        </p>
      </div>
    )
  }

  const statusBadge = clientBadge(route.status)

  return (
    <div className="flex flex-col gap-5">
<Button variant="ghost" nativeButton={false} render={<Link href="/rutas" />} className="w-fit -m-2">
          <ArrowLeftIcon /> Rutas
        </Button>

      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-xl font-bold tracking-tight">{route.routeCode}</h1>
            <Badge variant="secondary">{labelForRouteType(route.type)}</Badge>
            <Badge variant={statusBadge.variant} className={statusBadge.className || undefined}>
              {labelForRouteStatus(route.status)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {route.clientCount} {route.clientCount === 1 ? "cliente" : "clientes"} ·{" "}
            {nicaDateTime(route.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {route.status === "en_proceso" && (
            <Button
              type="button"
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={cancelRoute.isPending}
              onClick={() => cancelRoute.mutate()}
            >
              {cancelRoute.isPending ? <Loader2Icon className="animate-spin" /> : <BanIcon />}
              Cancelar ruta
            </Button>
          )}
          <Button
            type="button"
            onClick={() => setMapOpen(true)}
            disabled={points.length === 0}
          >
            <MapIcon /> Ver mapa
          </Button>
        </div>
      </div>

      {/* Roadmap / orden de visita */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Orden de visita</h2>
        </div>

        {orderedClients.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Esta ruta no tiene clientes.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {orderedClients.map((client, index) => {
              const badge = clientBadge(client.status)
              return (
                <li
                  key={client.id}
                  className={`flex cursor-pointer flex-row items-start gap-3 rounded-xl border p-3 ${clientCardClass(client.status)}`}
                  onClick={() => setViewingClient(client)}
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium leading-snug">
                          {client.fullName}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          {client.city && (
                            <>
                              <MapPinIcon className="size-3 shrink-0" />
                              {client.city}
                              {client.address ? ` · ${client.address}` : ""}
                            </>
                          )}
                        </p>
                        {!client.city && client.address && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {client.address}
                          </p>
                        )}
                        {client.phone && (
                          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <PhoneIcon className="size-3 shrink-0" /> {client.phone}
                          </p>
                        )}
                        {client.observation && (
                          <p className="mt-1 rounded-lg bg-background/70 px-2 py-1 text-xs italic text-muted-foreground">
                            “{client.observation}”
                          </p>
                        )}
                      </div>
                      <Badge variant={badge.variant} className={badge.className || undefined}>
                        {client.status === "pendiente"
                          ? "Pendiente"
                          : client.status === "completada"
                            ? "Completada"
                            : "Cancelada"}
                      </Badge>
                    </div>
                  </div>
                  <UserRoundIcon className="mt-1 size-4 shrink-0 text-muted-foreground/60" />
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <RouteMapDialog
        open={mapOpen}
        onOpenChange={setMapOpen}
        routeCode={route.routeCode}
        points={points}
      />

      <RouteClientDialog
        key={viewingClient?.id ?? "cerrado"}
        open={viewingClient !== null}
        onOpenChange={(next) => {
          if (!next) setViewingClient(null)
        }}
        routeCode={route.routeCode}
        routeType={route.type}
        client={viewingClient}
      />
    </div>
  )
}