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
import { matchesCarteraStatus } from "@/features/cartera/api/cartera.api"
import { CarteraDetailDialog } from "@/features/cartera/components/cartera-detail-dialog"
import { CarteraOrdersList } from "@/features/cartera/components/cartera-orders-list"
import { useCartera } from "@/features/cartera/hooks/use-cartera"
import type { CarteraStatusFilter } from "@/types/interfaces/cartera.interface"

const STATUS_OPTIONS: { value: CarteraStatusFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_mora", label: "En mora" },
  { value: "pagado", label: "Pagado" },
]

function nicaDate(createdAt: string): string {
  return new Date(new Date(createdAt).getTime() - 6 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

export function CarteraView() {
  const [statusFilter, setStatusFilter] = useState<CarteraStatusFilter>("todos")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [search, setSearch] = useState("")
  const [viewingId, setViewingId] = useState<string | null>(null)

  const { data: pagos = [], isLoading } = useCartera()

  const viewing = pagos.find((p) => p.id === viewingId) ?? null

  const filtered = pagos.filter((pago) => {
    if (!matchesCarteraStatus(pago.estadoPagoId, statusFilter)) return false
    if (dateFilter && nicaDate(pago.createdAt) !== dateFilter) return false
    if (search) {
      const q = search.trim().toLowerCase()
      const haystack = `${pago.customerName} ${pago.orderNumber ?? ""} ${pago.customerPhone ?? ""}`
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Cartera y abonos</h1>
        <p className="text-sm text-muted-foreground">
          Abonos de los pedidos aprobados. Aplica pagos cuando el cliente abone.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o número..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as CarteraStatusFilter)}
          >
            <SelectTrigger className="w-40 h-10 rounded-xl">
              <FilterIcon className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
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
        <CarteraOrdersList orders={filtered} onView={(order) => setViewingId(order.id)} />
      )}

      <CarteraDetailDialog
        key={viewing?.id ?? "cerrado"}
        order={viewing}
        onOpenChange={(open) => {
          if (!open) setViewingId(null)
        }}
      />
    </div>
  )
}