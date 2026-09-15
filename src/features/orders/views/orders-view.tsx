"use client"

import { toast } from "sonner"
import { FilterIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
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
import { OrderActionDialog } from "@/features/orders/components/order-action-dialog"
import { OrderDeleteDialog } from "@/features/orders/components/order-delete-dialog"
import { OrderDetailDialog } from "@/features/orders/components/order-detail-dialog"
import { OrderFormDialog } from "@/features/orders/components/order-form-dialog"
import { OrdersMobileList } from "@/features/orders/components/orders-mobile-list"
import { OrdersTable } from "@/features/orders/components/orders-table"
import {
  useDeleteOrder,
  useOrders,
  useSaveOrderProforma,
  useUpdateOrderStatus,
} from "@/features/orders/hooks/use-orders"
import { useStore } from "@/features/store/hooks/use-store"
import { LIST_PAGE_SIZE } from "@/lib/query-params"
import { useDebouncedValue } from "@/lib/use-debounced-value"
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
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebouncedValue(search.trim(), 300)

  const { data, isLoading, isError, error } = useOrders({
    page,
    pageSize: LIST_PAGE_SIZE,
    status: statusFilter,
    date: dateFilter || undefined,
    search: debouncedSearch || undefined,
  })

  const orders = data?.data ?? []
  const totalItems = data?.total ?? 0

  const totalPages = Math.max(1, Math.ceil(totalItems / LIST_PAGE_SIZE))
  const currentPage = Math.min(data?.page ?? 1, totalPages)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleStatusChange = (value: string | null) => {
    setStatusFilter((value as OrderStatusFilter) ?? "todos")
    setPage(1)
  }

  const handleDateChange = (value: string) => {
    setDateFilter(value)
    setPage(1)
  }

  const updateStatus = useUpdateOrderStatus()
  const deleteOrder = useDeleteOrder()
  const saveProforma = useSaveOrderProforma()
  const { data: store } = useStore()
  const [deleting, setDeleting] = useState<OrderDto | null>(null)
  const [viewing, setViewing] = useState<OrderDto | null>(null)
  const [editing, setEditing] = useState<OrderDto | null>(null)
  const [notifying, setNotifying] = useState<OrderDto | null>(null)
  const [formOpen, setFormOpen] = useState(false)
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
      let proformaUrl = order.proformaUrl

      // Pedidos sin proforma guardada (legacy): generarla y subirla una vez,
      // y persistir la URL para que futuros mensajes la reutilicen.
      if (!proformaUrl) {
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
        proformaUrl = uploaded.url
        saveProforma.mutate({ id: order.id, url: proformaUrl })
      }

      const url = generateApprovalWhatsAppUrl({
        order,
        bankAccounts,
        proformaUrl,
      })
      window.open(url, "_blank", "noopener,noreferrer")
    } catch {
      // El toast de error lo muestra el hook de la acción
    } finally {
      setSendingMessage(false)
    }
  }

  const handleNotify = async (order: OrderDto) => {
    setSendingMessage(true)
    try {
      let proformaUrl = order.proformaUrl

      // Pedidos sin proforma guardada (legacy): generarla y subirla una vez,
      // y persistir la URL para que futuros mensajes la reutilicen.
      if (!proformaUrl) {
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
        proformaUrl = uploaded.url
        saveProforma.mutate({ id: order.id, url: proformaUrl })
      }

      setNotifying({ ...order, proformaUrl })
    } catch {
      toast.error("No se pudo preparar la notificación. Intenta de nuevo.")
    } finally {
      setSendingMessage(false)
    }
  }

  const handleEdit = (order: OrderDto) => {
    setViewing(null)
    setEditing(order)
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-sm text-muted-foreground">Gestiona los pedidos de la tienda.</p>
          {!isLoading && !isError && (
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {totalItems} {totalItems === 1 ? "pedido" : "pedidos"}
            </p>
          )}
        </div>
        <Button onClick={() => setFormOpen(true)} className="gap-2">
          <PlusIcon className="size-4" />
          Nuevo pedido
        </Button>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "No se pudieron cargar los pedidos."}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full max-w-sm sm:flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente o número de pedido"
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
          <DataTablePagination
            page={currentPage}
            totalItems={totalItems}
            pageSize={LIST_PAGE_SIZE}
            onPageChange={setPage}
          />
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
        onNotify={handleNotify}
        onEdit={handleEdit}
        isPending={updateStatus.isPending}
        isSendingMessage={sendingMessage}
      />

      <OrderActionDialog
        open={notifying !== null}
        onOpenChange={(open) => {
          if (!open) setNotifying(null)
        }}
        order={notifying}
        onComplete={() => setNotifying(null)}
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

      <OrderFormDialog
        key={editing?.id ?? "nuevo-pedido"}
        open={formOpen || editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false)
            setEditing(null)
          }
        }}
        order={editing}
      />
    </div>
  )
}
