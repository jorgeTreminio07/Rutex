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
import type { SupplierDto } from "@/types/interfaces/supplier.interface"

interface SupplierDeleteDialogProps {
  supplier: SupplierDto | null
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onConfirm: () => Promise<void>
}

export function SupplierDeleteDialog({
  supplier,
  onOpenChange,
  isPending,
  onConfirm,
}: SupplierDeleteDialogProps) {
  return (
    <Dialog open={supplier !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Eliminar proveedor</DialogTitle>
          <DialogDescription>
            ¿Seguro que deseas eliminar al proveedor{" "}
            <span className="font-medium text-foreground">{supplier?.name}</span>? Esta acción no
            se puede deshacer.
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
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Eliminando…" : "Eliminar proveedor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}