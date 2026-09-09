"use client"

import { FilterIcon, SearchIcon, XIcon } from "lucide-react"
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
import { DeliveriesMobileList } from "@/features/deliveries/components/deliveries-mobile-list"
import { DeliveriesTable } from "@/features/deliveries/components/deliveries-table"
import { DeliveryDetailDialog } from "@/features/deliveries/components/delivery-detail-dialog"
import { useDeliveries } from "@/features/deliveries/hooks/use-deliveries"
import { nicaDate } from "@/features/deliveries/lib/format"
import {
  DELIVERY_STATUS_OPTIONS,
  matchesDeliveryStatus,
  type DeliveryStatusFilter,
} from "@/types/interfaces/delivery.interface"

export function DeliveriesView() {
  const { data: deliveries = [], isLoading, isError, error } = useDeliveries()

  const [statusFilter, setStatusFilter] = useState<DeliveryStatusFilter>("todos")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [search, setSearch] = useState("")
  const [viewingId, setViewingId] = useState<string | null>(null)

  const viewing = deliveries.find((d) => d.id === viewingId) ?? null

  const filtered = deliveries.filter((delivery) => {
    if (!matchesDeliveryStatus(delivery.statusId, statusFilter)) return false
    if (dateFilter && nicaDate(delivery.enteredAt) !== dateFilter) return false
    if (search) {
      const q = search.trim().toLowerCase()
      const haystack = `${delivery.orderNumber ?? ""} ${delivery.customerName} ${delivery.customerPhone ?? ""}`
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Almacén</h1>
        <p className="text-sm text-muted-foreground">
          Entregas de pedidos aprobados e ingresados al almacén.
        </p>
        {!isLoading && !isError && (
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            {deliveries.length} {deliveries.length === 1 ? "entrega" : "entregas"} en el almacén
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
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por pedido o cliente…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as DeliveryStatusFilter)}
          >
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
            <DatePicker value={dateFilter} onChange={setDateFilter} placeholder="Fecha" />
            {dateFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 px-2"
                onClick={() => setDateFilter("")}
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
            <DeliveriesTable deliveries={filtered} onView={(d) => setViewingId(d.id)} />
          </div>
          <div className="md:hidden">
            <DeliveriesMobileList deliveries={filtered} onView={(d) => setViewingId(d.id)} />
          </div>
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