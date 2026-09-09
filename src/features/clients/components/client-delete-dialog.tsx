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
import type { ClientDto } from "@/types/interfaces/client.interface"

interface ClientDeleteDialogProps {
  client: ClientDto | null
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onConfirm: () => Promise<void>
}

export function ClientDeleteDialog({
  client,
  onOpenChange,
  isPending,
  onConfirm,
}: ClientDeleteDialogProps) {
  return (
    <Dialog open={client !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Eliminar cliente</DialogTitle>
          <DialogDescription>
            ¿Seguro que deseas eliminar al cliente{" "}
            <span className="font-medium text-foreground">{client?.fullName}</span>? Esta acción no
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
            {isPending ? "Eliminando…" : "Eliminar cliente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}