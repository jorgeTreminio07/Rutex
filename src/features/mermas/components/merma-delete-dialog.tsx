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
import type { MermaDto } from "@/types/interfaces/merma.interface"

interface MermaDeleteDialogProps {
  merma: MermaDto | null
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onConfirm: () => Promise<void>
}

export function MermaDeleteDialog({
  merma,
  onOpenChange,
  isPending,
  onConfirm,
}: MermaDeleteDialogProps) {
  return (
    <Dialog open={merma !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Eliminar merma</DialogTitle>
          <DialogDescription>
            ¿Seguro que deseas eliminar la merma{" "}
            <span className="font-medium text-foreground">{merma?.mermaNumber}</span>? Se devolverá
            al stock lo restado de cada producto. Esta acción no se puede deshacer.
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
            {isPending ? "Eliminando…" : "Eliminar merma"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}