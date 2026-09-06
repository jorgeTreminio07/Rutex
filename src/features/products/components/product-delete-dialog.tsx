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
import type { ProductDto } from "@/types/interfaces/product.interface"

interface ProductDeleteDialogProps {
  product: ProductDto | null
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onConfirm: () => Promise<void>
}

export function ProductDeleteDialog({
  product,
  onOpenChange,
  isPending,
  onConfirm,
}: ProductDeleteDialogProps) {
  return (
    <Dialog open={product !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Eliminar producto</DialogTitle>
          <DialogDescription>
            ¿Seguro que deseas eliminar el producto{" "}
            <span className="font-medium text-foreground">{product?.name}</span>? Esta acción no
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
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "Eliminando…" : "Eliminar producto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}