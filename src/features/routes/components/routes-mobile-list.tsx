"use client"

import { EyeIcon, MapIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import {
  labelForRouteStatus,
  labelForRouteType,
  type RouteDto,
  type RouteStatus,
} from "@/types/interfaces/route.interface"
import { nicaDateTime } from "@/features/deliveries/lib/format"
import { usePaged } from "@/lib/use-paged"

const PAGE_SIZE = 10

function routeStatusBadge(status: RouteStatus) {
  switch (status) {
    case "completada":
      return { variant: "outline" as const, className: "border-emerald-600/40 bg-emerald-600/10 text-emerald-700" }
    case "cancelada":
      return { variant: "destructive" as const, className: "" }
    default:
      return { variant: "outline" as const, className: "border-primary/40 text-primary" }
  }
}

interface RoutesMobileListProps {
  routes: RouteDto[]
  onView: (route: RouteDto) => void
  onDelete: (route: RouteDto) => void
}

export function RoutesMobileList({ routes, onView, onDelete }: RoutesMobileListProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(routes, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((route) => {
          const badge = routeStatusBadge(route.status)
          return (
            <li key={route.id}>
              <Card
                onClick={() => onView(route)}
                className="flex cursor-pointer flex-row items-center gap-3 p-3"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <MapIcon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-mono text-sm font-medium">{route.routeCode}</p>
                    <Badge variant={badge.variant} className={badge.className || undefined}>
                      {labelForRouteStatus(route.status)}
                    </Badge>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge variant="secondary">{labelForRouteType(route.type)}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {route.clientCount} {route.clientCount === 1 ? "cliente" : "clientes"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {nicaDateTime(route.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onView(route)
                    }}
                    aria-label={`Ver detalle de la ruta ${route.routeCode}`}
                  >
                    <EyeIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(route)
                    }}
                    aria-label={`Eliminar ruta ${route.routeCode}`}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </Card>
            </li>
          )
        })}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay rutas registradas.
          </li>
        )}
      </ul>
      <DataTablePagination
        page={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  )
}