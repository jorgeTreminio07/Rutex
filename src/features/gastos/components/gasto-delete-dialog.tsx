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
import type { GastoDto } from "@/types/interfaces/gasto.interface"
import { fmtMoney } from "@/lib/format"

interface GastoDeleteDialogProps {
  gasto: GastoDto | null
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onConfirm: () => Promise<void>
}

export function GastoDeleteDialog({
  gasto,
  onOpenChange,
  isPending,
  onConfirm,
}: GastoDeleteDialogProps) {
  return (
    <Dialog open={gasto !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Eliminar gasto</DialogTitle>
          <DialogDescription>
            ¿Seguro que deseas eliminar el gasto{" "}
            <span className="font-medium text-foreground">{gasto?.title}</span> por{" "}
            {fmtMoney(gasto?.amount ?? 0)}?{" "}
            {gasto?.receiptPath && "También se eliminará el recibo del almacenamiento. "}Esta acción
            no se puede deshacer.
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
            {isPending ? "Eliminando…" : "Eliminar gasto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}