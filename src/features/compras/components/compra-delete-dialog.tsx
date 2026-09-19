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
import type { CompraDto } from "@/types/interfaces/compra.interface"
import { fmtMoney } from "@/lib/format"

interface CompraDeleteDialogProps {
  compra: CompraDto | null
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onConfirm: () => Promise<void>
}

export function CompraDeleteDialog({
  compra,
  onOpenChange,
  isPending,
  onConfirm,
}: CompraDeleteDialogProps) {
  return (
    <Dialog open={compra !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Eliminar compra</DialogTitle>
          <DialogDescription>
            ¿Seguro que deseas eliminar la compra{" "}
            <span className="font-medium text-foreground">{compra?.title}</span>
            {compra?.supplierName ? (
              <>
                {" "}del proveedor{" "}
                <span className="font-medium text-foreground">{compra.supplierName}</span>
              </>
            ) : null}{" "}
            por {fmtMoney(compra?.amount ?? 0)}?{" "}
            {compra?.receiptPath && "También se eliminará el recibo del almacenamiento. "}Esta
            acción no se puede deshacer.
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
            {isPending ? "Eliminando…" : "Eliminar compra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}