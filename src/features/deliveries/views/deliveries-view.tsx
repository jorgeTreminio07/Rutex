"use client"

import { FilterIcon, SearchIcon, XIcon } from "lucide-react"
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
import { DeliveriesMobileList } from "@/features/deliveries/components/deliveries-mobile-list"
import { DeliveriesTable } from "@/features/deliveries/components/deliveries-table"
import { DeliveryDetailDialog } from "@/features/deliveries/components/delivery-detail-dialog"
import { useDeliveries } from "@/features/deliveries/hooks/use-deliveries"
import { DELIVERY_STATUS_OPTIONS, type DeliveryStatusFilter } from "@/types/interfaces/delivery.interface"
import { LIST_PAGE_SIZE } from "@/lib/query-params"
import { useDebouncedValue } from "@/lib/use-debounced-value"

export function DeliveriesView() {
  const [statusFilter, setStatusFilter] = useState<DeliveryStatusFilter>("todos")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [viewingId, setViewingId] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const { data, isLoading, isError, error } = useDeliveries({
    page,
    pageSize: LIST_PAGE_SIZE,
    search: debouncedSearch || undefined,
    date: dateFilter || undefined,
    status: statusFilter,
  })
  const deliveries = data?.data ?? []
  const totalItems = data?.total ?? 0

  const totalPages = Math.max(1, Math.ceil(totalItems / LIST_PAGE_SIZE))
  const currentPage = Math.min(data?.page ?? 1, totalPages)

  const viewing = deliveries.find((d) => d.id === viewingId) ?? null

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusChange = (value: string | null) => {
    setStatusFilter((value as DeliveryStatusFilter) ?? "todos")
    setPage(1)
  }

  const handleDateChange = (value: string) => {
    setDateFilter(value)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Almacén</h1>
        <p className="text-sm text-muted-foreground">
          Entregas de pedidos aprobados e ingresados al almacén.
        </p>
        {!isLoading && !isError && (
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {totalItems} {totalItems === 1 ? "entrega" : "entregas"} en el almacén
          </p>
        )}
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Error al cargar las entregas:{" "}
          {error instanceof Error ? error.message : "Ocurrió un error inesperado"}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm sm:flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por pedido o cliente…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40 h-10 rounded-xl">
              <FilterIcon className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DELIVERY_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <SelectItemText>{opt.label}</SelectItemText>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <DatePicker value={dateFilter} onChange={handleDateChange} placeholder="Fecha" />
            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-2"
                onClick={() => handleDateChange("")}
                aria-label="Limpiar filtro de fecha"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <DeliveriesTable deliveries={deliveries} onView={(d) => setViewingId(d.id)} />
          </div>
          <div className="md:hidden">
            <DeliveriesMobileList deliveries={deliveries} onView={(d) => setViewingId(d.id)} />
          </div>
          <DataTablePagination
            page={currentPage}
            totalItems={totalItems}
            pageSize={LIST_PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}

      <DeliveryDetailDialog
        key={viewing?.id ?? "cerrado"}
        delivery={viewing}
        onOpenChange={(open) => {
          if (!open) setViewingId(null)
        }}
      />
    </div>
  )
}