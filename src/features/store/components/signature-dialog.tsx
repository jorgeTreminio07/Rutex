"use client"

import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  SignaturePad,
  type SignaturePadHandle,
} from "@/features/store/components/signature-pad"

interface SignatureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (file: File) => void
}

export function SignatureDialog({ open, onOpenChange, onConfirm }: SignatureDialogProps) {
  const padRef = useRef<SignaturePadHandle>(null)
  const [hasInk, setHasInk] = useState(false)

  const handleConfirm = async () => {
    const file = await padRef.current?.toFile()
    if (file && hasInk) onConfirm(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dibujar firma</DialogTitle>
          <DialogDescription>
            Firma con tu dedo, lapiz tactil o con el mouse dentro del recuadro. Se guardará como imagen.
          </DialogDescription>
        </DialogHeader>

        <SignaturePad ref={padRef} onInkChange={setHasInk} />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!hasInk} onClick={handleConfirm}>
            Guardar firma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}