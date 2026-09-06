"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { OrderDto } from "@/types/interfaces/order.interface"

interface OrderDeleteDialogProps {
  order: OrderDto | null
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onConfirm: () => Promise<void>
}

export function OrderDeleteDialog({
  order,
  onOpenChange,
  isPending,
  onConfirm,
}: OrderDeleteDialogProps) {
  return (
    <Dialog open={order !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Eliminar pedido</DialogTitle>
          <DialogDescription>
            ¿Seguro que deseas eliminar el pedido{" "}
            <span className="font-medium text-foreground">{order?.orderNumber ?? "sin número"}</span>?
            Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Eliminando…" : "Eliminar pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}