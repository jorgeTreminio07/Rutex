"use client"

import { FilterIcon, PlusIcon, SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { DataTablePagination } from "@/components/data-table/data-table-pagination"
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
  ROUTE_STATUS_OPTIONS,
  type RouteDto,
  type RouteStatusFilter,
} from "@/types/interfaces/route.interface"
import { RouteDeleteDialog } from "@/features/routes/components/route-delete-dialog"
import { RouteFormDialog } from "@/features/routes/components/route-form-dialog"
import { RoutesMobileList } from "@/features/routes/components/routes-mobile-list"
import { RoutesTable } from "@/features/routes/components/routes-table"
import { useDeleteRoute, useRoutes } from "@/features/routes/hooks/use-routes"
import { LIST_PAGE_SIZE } from "@/lib/query-params"
import { useDebouncedValue } from "@/lib/use-debounced-value"

export function RoutesView() {
  const deleteRoute = useDeleteRoute()
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<RouteStatusFilter>("todos")
  const [dateFilter, setDateFilter] = useState("")
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [deleting, setDeleting] = useState<RouteDto | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const { data, isLoading, isError, error } = useRoutes({
    page,
    pageSize: LIST_PAGE_SIZE,
    search: debouncedSearch || undefined,
    date: dateFilter || undefined,
    status: statusFilter,
  })
  const routes = data?.data ?? []
  const totalItems = data?.total ?? 0

  const totalPages = Math.max(1, Math.ceil(totalItems / LIST_PAGE_SIZE))
  const currentPage = Math.min(data?.page ?? 1, totalPages)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusChange = (value: string | null) => {
    setStatusFilter((value as RouteStatusFilter) ?? "todos")
    setPage(1)
  }

  const handleDateChange = (value: string) => {
    setDateFilter(value)
    setPage(1)
  }

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
              {totalItems} {totalItems === 1 ? "ruta" : "rutas"}
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
        <div className="relative w-full max-w-sm sm:flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por código de ruta…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-10 rounded-xl pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
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
            <DatePicker value={dateFilter} onChange={handleDateChange} placeholder="Todas las fechas" />
            {dateFilter && (
              <Button variant="ghost" size="sm" onClick={() => handleDateChange("")}>
                Limpiar
              </Button>
            )}
          </div>
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
            <RoutesTable routes={routes} onView={handleView} onDelete={setDeleting} />
          </div>
          <div className="md:hidden">
            <RoutesMobileList routes={routes} onView={handleView} onDelete={setDeleting} />
          </div>
          <DataTablePagination
            page={currentPage}
            totalItems={totalItems}
            pageSize={LIST_PAGE_SIZE}
            onPageChange={setPage}
          />
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