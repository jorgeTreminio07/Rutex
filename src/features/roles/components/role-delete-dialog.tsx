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
import type { RoleDto } from "@/types/interfaces/user.interface"

interface RoleDeleteDialogProps {
  role: RoleDto | null
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onConfirm: () => Promise<void>
}

export function RoleDeleteDialog({
  role,
  onOpenChange,
  isPending,
  onConfirm,
}: RoleDeleteDialogProps) {
  return (
    <Dialog open={role !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Eliminar rol</DialogTitle>
          <DialogDescription>
            ¿Seguro que deseas eliminar el rol{" "}
            <span className="font-medium text-foreground">{role?.name}</span>? Esta acción no se
            puede deshacer.
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
            {isPending ? "Eliminando…" : "Eliminar rol"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}