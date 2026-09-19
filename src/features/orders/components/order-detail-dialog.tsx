"use client"

import { CalendarIcon, ClipboardListIcon, CreditCardIcon, PencilIcon, PhoneIcon, SendIcon, ShoppingBagIcon, Trash2Icon, UserIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { OrderDto } from "@/types/interfaces/order.interface"
import { fmtMoney, formatQty } from "@/lib/format"

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "Aprobado":
      return "default"
    case "En proceso":
      return "secondary"
    case "Rechazado":
      return "destructive"
    default:
      return "outline"
  }
}

function getPaymentLine(order: OrderDto): string {
  switch (order.paymentType) {
    case "cuotas_2":
      return `2 pagos quincenales de ${fmtMoney(order.total / 2)} c/u`
    case "cuotas_4":
      return `4 pagos semanales de ${fmtMoney(order.total / 4)} c/u`
    default:
      return "De contado (pago único)"
  }
}

interface OrderDetailDialogProps {
  order: OrderDto | null
  onOpenChange: (open: boolean) => void
  onApprove: (order: OrderDto) => void
  onReject: (order: OrderDto) => void
  onDelete: (order: OrderDto) => void
  onNotify: (order: OrderDto) => void
  onEdit: (order: OrderDto) => void
  isPending: boolean
  isSendingMessage: boolean
}

export function OrderDetailDialog({
  order,
  onOpenChange,
  onApprove,
  onReject,
  onDelete,
  onNotify,
  onEdit,
  isPending,
  isSendingMessage,
}: OrderDetailDialogProps) {
  return (
    <Dialog open={order !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending} className="sm:max-w-lg">
        {order && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 pr-6">
                <ClipboardListIcon className="size-4 text-muted-foreground" />
                <DialogTitle className="font-mono">{order.orderNumber || "Sin número"}</DialogTitle>
                <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
              </div>
            </DialogHeader>

            <div className="-mx-4 flex max-h-[60dvh] flex-col gap-4 overflow-y-auto px-4">
              <div className="space-y-2 rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <UserIcon className="size-4 text-muted-foreground" />
                  <span className="font-semibold">{order.customerName}</span>
                </div>
                {order.customerPhone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <PhoneIcon className="size-4" />
                    {order.customerPhone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="size-4" />
                  {new Date(order.createdAt).toLocaleString("es-NI")}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Modalidad de pago</span>
                </div>
                <p className="text-sm text-muted-foreground">{getPaymentLine(order)}</p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2">
                  <ShoppingBagIcon className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Productos</span>
                </div>
                <div className="mt-2 divide-y">
                  {order.items.map((item, idx) => (
                    <div key={`${item.productId}-${idx}`} className="flex items-start gap-3 py-2 text-sm">
                      <span className="mt-0.5 shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs font-bold">
                        {formatQty(item.quantity)}x
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-medium">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{fmtMoney(item.price)} c/u</p>
                      </div>
                      <span className="shrink-0 font-semibold">{fmtMoney(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.notes && (
                <div className="space-y-1 rounded-xl border p-4 text-sm">
                  <span className="font-semibold">Notas</span>
                  <p className="text-muted-foreground">{order.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-lg font-extrabold text-primary">{fmtMoney(order.total)}</span>
              </div>
            </div>

            {order.statusId === 5 && !order.canApprove && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  Hay productos sin stock suficiente; no se puede aprobar este pedido.
                </p>
              )}

            {(order.statusId === 5 || order.statusId === 6) && (
              <Button
                type="button"
                variant="default"
                className="w-full gap-2"
                disabled={isSendingMessage}
                onClick={() => onNotify(order)}
              >
                <SendIcon className="size-4" />
                {isSendingMessage ? "Preparando…" : "Notificar al cliente"}
              </Button>
            )}

            <DialogFooter>
              {(order.statusId === 5 || order.statusId === 6) && (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  disabled={isPending}
                  title={
                    order.statusId === 6
                      ? "Editar el pedido aprobado ajusta inventario, cartera y proforma"
                      : undefined
                  }
                  onClick={() => onEdit(order)}
                >
                  <PencilIcon className="size-4" />
                  Editar
                </Button>
              )}
              {order.statusId === 5 && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-destructive border-destructive/20 hover:bg-destructive/5"
                    disabled={isPending}
                    onClick={() => onReject(order)}
                  >
                    Rechazar
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    disabled={isPending || !order.canApprove}
                    title={order.canApprove ? undefined : "Sin stock suficiente para aprobar"}
                    onClick={() => onApprove(order)}
                  >
                    Aprobar
                  </Button>
                </>
              )}
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={isPending}
                onClick={() => onDelete(order)}
              >
                <Trash2Icon />
                Eliminar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}