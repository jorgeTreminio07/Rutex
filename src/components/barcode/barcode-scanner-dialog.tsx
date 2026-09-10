"use client"

import { useEffect, useId, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2Icon } from "lucide-react"

type Html5QrcodeInstance = InstanceType<typeof import("html5-qrcode")["Html5Qrcode"]>

interface BarcodeScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScan: (barcode: string) => void
  title?: string
  description?: string
}

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onScan,
  title = "Escanear código de barras",
  description = "Apunta la cámara al código de barras del producto.",
}: BarcodeScannerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {open && (
          <ScannerBody
            onScan={onScan}
            onCancel={() => onOpenChange(false)}
          />
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ScannerBody({ onScan, onCancel }: { onScan: (barcode: string) => void; onCancel: () => void }) {
  const containerId = useId().replace(/:/g, "")
  const [status, setStatus] = useState<"starting" | "ready" | "error">("starting")
  const [error, setError] = useState("")
  const handledRef = useRef(false)
  const onScanRef = useRef(onScan)

  useEffect(() => {
    onScanRef.current = onScan
  })

  useEffect(() => {
    let cancelled = false
    let started = false
    let scanner: Html5QrcodeInstance | null = null

    const init = async () => {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode")
        if (cancelled) return

        scanner = new Html5Qrcode(containerId, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.CODE_93,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
        })

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 140 },
          },
          (decodedText: string) => {
            if (handledRef.current) return
            handledRef.current = true
            onScanRef.current(decodedText.trim())
          },
          () => {
            /* ignorar frames sin decodificar */
          },
        )

        if (cancelled) {
          await scanner.stop().catch(() => undefined)
          scanner.clear()
          return
        }

        started = true
        setStatus("ready")
      } catch (err) {
        if (cancelled) return
        scanner?.clear()
        setStatus("error")
        setError(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Permiso de cámara denegado. Habilita el acceso a la cámara e intenta de nuevo."
            : "No se pudo iniciar la cámara. Revisa que tengas una cámara disponible.",
        )
      }
    }

    void init()

    return () => {
      cancelled = true
      if (started && scanner) {
        scanner.stop().catch(() => undefined).then(() => scanner?.clear())
      }
    }
  }, [containerId])

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div id={containerId} className="h-72 w-full overflow-hidden rounded-xl bg-black/80" />
        {status === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            Iniciando cámara…
          </div>
        )}
      </div>

      {status === "error" && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button type="button" variant="outline" onClick={onCancel} className="self-start">
            Cerrar
          </Button>
        </div>
      )}
    </div>
  )
}