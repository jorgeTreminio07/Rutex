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
import type { UserDto } from "@/types/interfaces/user.interface"

interface UserDeleteDialogProps {
  user: UserDto | null
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onConfirm: () => Promise<void>
}

export function UserDeleteDialog({
  user,
  onOpenChange,
  isPending,
  onConfirm,
}: UserDeleteDialogProps) {
  return (
    <Dialog open={user !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Eliminar usuario</DialogTitle>
          <DialogDescription>
            ¿Seguro que deseas eliminar al usuario{" "}
            <span className="font-medium text-foreground">{user?.username}</span>? Esta acción no se
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
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isPending}>
            {isPending ? "Eliminando…" : "Eliminar usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}