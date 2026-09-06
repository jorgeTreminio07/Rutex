"use client"

import { FilterIcon, SearchIcon, CalendarIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
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
import { OrderDeleteDialog } from "@/features/orders/components/order-delete-dialog"
import { OrdersMobileList } from "@/features/orders/components/orders-mobile-list"
import { OrdersTable } from "@/features/orders/components/orders-table"
import {
  useDeleteOrder,
  useOrders,
  useUpdateOrderStatus,
} from "@/features/orders/hooks/use-orders"
import type { OrderStatusFilter } from "@/features/orders/api/orders.api"
import type { OrderDto } from "@/types/interfaces/order.interface"

const STATUS_OPTIONS: { value: OrderStatusFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "en_proceso", label: "En proceso" },
  { value: "aprobado", label: "Aprobado" },
  { value: "rechazado", label: "Rechazado" },
]

export function OrdersView() {
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("todos")
  const [dateFilter, setDateFilter] = useState<string>("")
  const [search, setSearch] = useState("")

  const { data: orders = [], isLoading } = useOrders({
    status: statusFilter,
    date: dateFilter || undefined,
    search: search || undefined,
  })

  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()
  const [deleting, setDeleting] = useState<OrderDto | null>(null)

  const handleApprove = async (order: OrderDto) => {
    await updateStatus.mutateAsync({ id: order.id, statusId: 6 })
  }

  const handleReject = async (order: OrderDto) => {
    await updateStatus.mutateAsync({ id: order.id, statusId: 7 })
  }

  const handleToday = () => {
    const today = new Date().toISOString().split("T")[0]
    setDateFilter(today === dateFilter ? "" : today)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-sm text-muted-foreground">Gestiona los pedidos de la tienda.</p>
        </div>
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
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatusFilter)}>
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
          <Button
            variant={dateFilter ? "default" : "outline"}
            size="sm"
            onClick={handleToday}
            className="h-10 rounded-xl"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {dateFilter ? "Hoy" : "Filtrar hoy"}
          </Button>
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
            <OrdersTable
              orders={orders}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={setDeleting}
            />
          </div>
          <div className="md:hidden">
            <OrdersMobileList
              orders={orders}
              onApprove={handleApprove}
              onReject={handleReject}
              onDelete={setDeleting}
            />
          </div>
        </>
      )}

      <OrderDeleteDialog
        order={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        isPending={deleteOrder.isPending}
        onConfirm={async () => {
          if (!deleting) return
          await deleteOrder.mutateAsync(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}
