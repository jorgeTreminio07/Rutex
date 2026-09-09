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
import type { DeliveryDto, NextDeliveryStatus } from "@/types/interfaces/delivery.interface"

interface DeliveryAdvanceDialogProps {
  open: boolean
  delivery: DeliveryDto | null
  next: NextDeliveryStatus | null
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onConfirm: () => Promise<void>
}

export function DeliveryAdvanceDialog({
  open,
  delivery,
  next,
  onOpenChange,
  isPending,
  onConfirm,
}: DeliveryAdvanceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Avanzar estado de entrega</DialogTitle>
          <DialogDescription>
            ¿Seguro que deseas pasar la entrega{" "}
            <span className="font-mono font-medium text-foreground">{delivery?.orderNumber}</span> de{" "}
            <span className="font-medium text-foreground">{delivery?.status}</span> a{" "}
            <span className="font-medium text-foreground">{next?.label}</span>? El cambio no se
            puede revertir.
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
          <Button type="button" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Avanzando…" : `Avanzar a ${next?.label}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}