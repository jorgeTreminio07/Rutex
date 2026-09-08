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
import { uploadProformaRequest } from "@/features/catalog/api/catalog.api"
import { generateProformaPdf } from "@/features/catalog/lib/proforma"
import {
  generateApprovalWhatsAppUrl,
  generateRejectionWhatsAppUrl,
  type BankAccountInfo,
} from "@/features/catalog/lib/whatsapp"
import { OrderDeleteDialog } from "@/features/orders/components/order-delete-dialog"
import { OrderDetailDialog } from "@/features/orders/components/order-detail-dialog"
import { OrdersMobileList } from "@/features/orders/components/orders-mobile-list"
import { OrdersTable } from "@/features/orders/components/orders-table"
import {
  useDeleteOrder,
  useOrders,
  useUpdateOrderStatus,
} from "@/features/orders/hooks/use-orders"
import { useStore } from "@/features/store/hooks/use-store"
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
  const [dateFilter, setDateFilter] = useState<string>(() => {
    const nicaNow = new Date(Date.now() - 6 * 60 * 60 * 1000)
    return nicaNow.toISOString().slice(0, 10)
  })
  const [search, setSearch] = useState("")

  const { data: orders = [], isLoading } = useOrders({
    status: statusFilter,
    date: dateFilter || undefined,
    search: search || undefined,
  })

  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()
  const { data: store } = useStore()
  const [deleting, setDeleting] = useState<OrderDto | null>(null)
  const [viewing, setViewing] = useState<OrderDto | null>(null)
  const [sendingMessage, setSendingMessage] = useState(false)

  const bankAccounts: BankAccountInfo[] = (store?.bankAccounts ?? []).map((a) => ({
    bankName: a.bankName,
    accountNumber: a.accountNumber,
    accountHolder: a.accountHolder,
    currency: a.currency,
  }))

  const sendApprovalMessage = async (order: OrderDto) => {
    setSendingMessage(true)
    try {
      const pdf = generateProformaPdf({
        storeName: store?.name ?? "Rutex",
        storePhone: store?.phone ?? null,
        customerName: order.customerName,
        customerPhone: order.customerPhone ?? "",
        orderNumber: order.orderNumber,
        items: order.items,
        total: order.total,
        paymentType: order.paymentType,
        bankAccounts,
      })

      const blob = new Blob([pdf.output("blob")], { type: "application/pdf" })
      const uploaded = await uploadProformaRequest(
        blob,
        order.customerName.replace(/\s+/g, "-"),
      )

      const url = generateApprovalWhatsAppUrl({
        order,
        bankAccounts,
        proformaUrl: uploaded.url,
      })
      window.open(url, "_blank", "noopener,noreferrer")
    } catch {
      // El toast de error lo muestra el hook de la acción
    } finally {
      setSendingMessage(false)
    }
  }

  const handleApprove = async (order: OrderDto) => {
    try {
      await updateStatus.mutateAsync({ id: order.id, statusId: 6 })
      setViewing(null)
      await sendApprovalMessage(order)
    } catch {
      // El toast de error lo muestra el hook
    }
  }

  const handleReject = async (order: OrderDto) => {
    try {
      await updateStatus.mutateAsync({ id: order.id, statusId: 7 })
      setViewing(null)
      const url = generateRejectionWhatsAppUrl(order)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch {
      // El toast de error lo muestra el hook
    }
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
            <OrdersTable orders={orders} onView={setViewing} />
          </div>
          <div className="md:hidden">
            <OrdersMobileList orders={orders} onView={setViewing} />
          </div>
        </>
      )}

      <OrderDetailDialog
        order={viewing}
        onOpenChange={(open) => {
          if (!open) setViewing(null)
        }}
        onApprove={handleApprove}
        onReject={handleReject}
        onDelete={setDeleting}
        onSendApproval={sendApprovalMessage}
        isPending={updateStatus.isPending}
        isSendingMessage={sendingMessage}
      />

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
          setViewing(null)
        }}
      />
    </div>
  )
}
