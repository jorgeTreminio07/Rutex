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
import type { RouteDto } from "@/types/interfaces/route.interface"

interface RouteDeleteDialogProps {
  route: RouteDto | null
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onConfirm: () => Promise<void>
}

export function RouteDeleteDialog({
  route,
  onOpenChange,
  isPending,
  onConfirm,
}: RouteDeleteDialogProps) {
  return (
    <Dialog open={route !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Eliminar ruta</DialogTitle>
          <DialogDescription>
            ¿Seguro que deseas eliminar la ruta{" "}
            <span className="font-medium text-foreground">{route?.routeCode}</span>? Esta acción no
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
            {isPending ? "Eliminando…" : "Eliminar ruta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}