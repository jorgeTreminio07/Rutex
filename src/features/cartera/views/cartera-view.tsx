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
import { CarteraDetailDialog } from "@/features/cartera/components/cartera-detail-dialog"
import { CarteraOrdersList } from "@/features/cartera/components/cartera-orders-list"
import { useCartera } from "@/features/cartera/hooks/use-cartera"
import type { CarteraStatusFilter } from "@/types/interfaces/cartera.interface"
import { LIST_PAGE_SIZE } from "@/lib/query-params"
import { useDebouncedValue } from "@/lib/use-debounced-value"

const STATUS_OPTIONS: { value: CarteraStatusFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendiente" },
  { value: "en_mora", label: "En mora" },
  { value: "pagado", label: "Pagado" },
]

export function CarteraView() {
  const [statusFilter, setStatusFilter] = useState<CarteraStatusFilter>("todos")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [viewingId, setViewingId] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const result = useCartera({
    page,
    pageSize: LIST_PAGE_SIZE,
    search: debouncedSearch || undefined,
    date: dateFilter || undefined,
    status: statusFilter,
  })
  const pagos = result.data?.data ?? []
  const totalItems = result.data?.total ?? 0

  const totalPages = Math.max(1, Math.ceil(totalItems / LIST_PAGE_SIZE))
  const currentPage = Math.min(result.data?.page ?? 1, totalPages)

  const viewing = pagos.find((p) => p.id === viewingId) ?? null

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusChange = (value: string | null) => {
    setStatusFilter((value as CarteraStatusFilter) ?? "todos")
    setPage(1)
  }

  const handleDateChange = (value: string) => {
    setDateFilter(value)
    setPage(1)
  }

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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
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

      {result.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <CarteraOrdersList orders={pagos} onView={(order) => setViewingId(order.id)} />
          <DataTablePagination
            page={currentPage}
            totalItems={totalItems}
            pageSize={LIST_PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
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