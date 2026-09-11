"use client"

import { EyeIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

interface RoutesTableProps {
  routes: RouteDto[]
  onView: (route: RouteDto) => void
  onDelete: (route: RouteDto) => void
}

export function RoutesTable({ routes, onView, onDelete }: RoutesTableProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(routes, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="w-24">Clientes</TableHead>
            <TableHead className="w-32">Estado</TableHead>
            <TableHead>Creada</TableHead>
            <TableHead className="w-12 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((route) => {
            const badge = routeStatusBadge(route.status)
            return (
              <TableRow key={route.id} className="cursor-pointer" onClick={() => onView(route)}>
                <TableCell>
                  <span className="font-mono text-sm font-medium">{route.routeCode}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{labelForRouteType(route.type)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {route.clientCount} {route.clientCount === 1 ? "cliente" : "clientes"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={badge.variant} className={badge.className || undefined}>
                    {labelForRouteStatus(route.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {nicaDateTime(route.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
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
                </TableCell>
              </TableRow>
            )
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No hay rutas registradas.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataTablePagination
        page={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  )
}