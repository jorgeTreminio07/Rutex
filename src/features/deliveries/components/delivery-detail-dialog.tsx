"use client"

import { ArrowRightIcon, PackageIcon, PhoneIcon, TruckIcon, UserIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DeliveryAdvanceDialog } from "@/features/deliveries/components/delivery-advance-dialog"
import { useAdvanceDeliveryStatus } from "@/features/deliveries/hooks/use-deliveries"
import { nicaDateTime } from "@/features/deliveries/lib/format"
import { useProducts } from "@/features/products/hooks/use-products"
import {
  deliveryStatusVariant,
  nextDeliveryStatus,
  type DeliveryDto,
} from "@/types/interfaces/delivery.interface"

interface DeliveryDetailDialogProps {
  delivery: DeliveryDto | null
  onOpenChange: (open: boolean) => void
}

export function DeliveryDetailDialog({ delivery, onOpenChange }: DeliveryDetailDialogProps) {
  const advance = useAdvanceDeliveryStatus()
  const { data: products = [] } = useProducts()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const imageByProductId = useMemo(() => {
    const map = new Map<string, string>()
    for (const product of products) {
      if (product.images[0]) map.set(product.id, product.images[0])
    }
    return map
  }, [products])

  if (!delivery) return <Dialog open={false} onOpenChange={onOpenChange} />

  const next = nextDeliveryStatus(delivery.statusId)
  const totalUnits = delivery.items.reduce((sum, item) => sum + item.quantity, 0)

  const handleAdvance = async () => {
    if (!next) return
    await advance.mutateAsync({ id: delivery.id, statusId: next.statusId })
    setConfirmOpen(false)
  }

  return (
    <>
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={!advance.isPending} className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2 pr-6">
              <TruckIcon className="size-4 text-muted-foreground" />
              <DialogTitle className="font-mono">{delivery.orderNumber}</DialogTitle>
              <Badge variant={deliveryStatusVariant(delivery.statusId)}>{delivery.status}</Badge>
            </div>
          </DialogHeader>

          <div className="-mx-4 flex max-h-[60dvh] flex-col gap-4 overflow-y-auto px-4">
            <div className="space-y-2 rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <UserIcon className="size-4 text-muted-foreground" />
                <span className="font-semibold">{delivery.customerName}</span>
              </div>
              {delivery.customerPhone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <PhoneIcon className="size-4" />
                  {delivery.customerPhone}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PackageIcon className="size-4" />
                Ingresado en almacén · {nicaDateTime(delivery.enteredAt)}
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Productos del pedido</p>
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{totalUnits}</span>{" "}
                  {totalUnits === 1 ? "unidad" : "unidades"}
                </span>
              </div>
              <div className="mt-2 divide-y">
                {delivery.items.length === 0 && (
                  <p className="py-2 text-sm text-muted-foreground">Sin productos.</p>
                )}
                {delivery.items.map((item) => {
                  const image = imageByProductId.get(item.productId)
                  return (
                    <div
                      key={item.productId}
                      className="flex items-center gap-3 py-2 text-sm"
                    >
                      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                        {image ? (
                          <img
                            src={image}
                            alt={item.productName}
                            className="size-12 rounded-lg object-cover"
                          />
                        ) : (
                          <PackageIcon className="size-5 text-muted-foreground" />
                        )}
                      </div>
                      <p className="min-w-0 flex-1 truncate font-medium">{item.productName}</p>
                      <Badge variant="outline" className="shrink-0">
                        x{item.quantity}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            {next ? (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => setConfirmOpen(true)}
                disabled={advance.isPending}
              >
                <ArrowRightIcon className="size-4" />
                Avanzar a {next.label}
              </Button>
            ) : (
              <p className="w-full rounded-lg bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary">
                Entrega completada
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeliveryAdvanceDialog
        delivery={delivery}
        next={next}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        isPending={advance.isPending}
        onConfirm={handleAdvance}
      />
    </>
  )
}