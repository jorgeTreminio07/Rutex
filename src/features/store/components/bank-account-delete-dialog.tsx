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
import type { BankAccountDto } from "@/types/interfaces/store.interface"

interface BankAccountDeleteDialogProps {
  account: BankAccountDto | null
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onConfirm: () => Promise<void>
}

export function BankAccountDeleteDialog({
  account,
  onOpenChange,
  isPending,
  onConfirm,
}: BankAccountDeleteDialogProps) {
  return (
    <Dialog open={account !== null} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Eliminar cuenta bancaria</DialogTitle>
          <DialogDescription>
            ¿Seguro que deseas eliminar la cuenta{" "}
            <span className="font-medium text-foreground">{account?.bankName}</span> con número{" "}
            <span className="font-medium text-foreground">•••• {account?.lastFourDigits}</span>? Esta
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
            {isPending ? "Eliminando…" : "Eliminar cuenta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}