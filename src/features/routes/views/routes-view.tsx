"use client"

import { FilterIcon, PlusIcon, SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  matchesRouteStatus,
  ROUTE_STATUS_OPTIONS,
  type RouteDto,
  type RouteStatusFilter,
} from "@/types/interfaces/route.interface"
import { nicaDate } from "@/features/deliveries/lib/format"
import { RouteDeleteDialog } from "@/features/routes/components/route-delete-dialog"
import { RouteFormDialog } from "@/features/routes/components/route-form-dialog"
import { RoutesMobileList } from "@/features/routes/components/routes-mobile-list"
import { RoutesTable } from "@/features/routes/components/routes-table"
import { useDeleteRoute, useRoutes } from "@/features/routes/hooks/use-routes"

export function RoutesView() {
  const { data: routes = [], isLoading, isError, error } = useRoutes()
  const deleteRoute = useDeleteRoute()
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<RouteStatusFilter>("todos")
  const [dateFilter, setDateFilter] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<RouteDto | null>(null)

  const filtered = (routes as RouteDto[]).filter((route) => {
    if (!matchesRouteStatus(route.status, statusFilter)) return false
    if (dateFilter && nicaDate(route.createdAt) !== dateFilter) return false
    if (search) {
      const q = search.trim().toLowerCase()
      if (!route.routeCode.toLowerCase().includes(q)) return false
    }
    return true
  })

  const handleView = (route: RouteDto) => {
    router.push(`/rutas/${route.routeCode}`)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Rutas</h1>
          <p className="text-sm text-muted-foreground">
            Planifica visitas y entregas a tus clientes.
          </p>
          {!isLoading && !isError && (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {routes.length} {routes.length === 1 ? "ruta" : "rutas"}
            </p>
          )}
        </div>
        <Button type="button" onClick={() => setFormOpen(true)}>
          <PlusIcon /> Nueva ruta
        </Button>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "No se pudieron cargar las rutas."}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código de ruta…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RouteStatusFilter)}>
          <SelectTrigger className="h-10 w-44 rounded-xl">
            <FilterIcon className="mr-2 size-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROUTE_STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <SelectItemText>{opt.label}</SelectItemText>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <DatePicker value={dateFilter} onChange={setDateFilter} placeholder="Todas las fechas" />
          {dateFilter && (
            <Button variant="ghost" size="sm" onClick={() => setDateFilter("")}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <RoutesTable routes={filtered} onView={handleView} onDelete={setDeleting} />
          </div>
          <div className="md:hidden">
            <RoutesMobileList routes={filtered} onView={handleView} onDelete={setDeleting} />
          </div>
        </>
      )}

      <RouteFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <RouteDeleteDialog
        route={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        isPending={deleteRoute.isPending}
        onConfirm={async () => {
          if (!deleting) return
          const code = deleting.routeCode
          setDeleting(null)
          try {
            await deleteRoute.mutateAsync(code)
          } catch {
            // el toast de error ya lo muestra useDeleteRoute
          }
        }}
      />
    </div>
  )
}