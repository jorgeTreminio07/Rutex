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
  const scannerRef = useRef<Html5QrcodeInstance | null>(null)
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    onScanRef.current = onScan
  })

  const handleZoom = (value: number) => {
    setZoom(value)
    const s = scannerRef.current
    if (!s) return
    s.getRunningTrackCameraCapabilities().zoomFeature().apply(value).catch(() => undefined)
  }

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
          useBarCodeDetectorIfSupported: true,
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
            videoConstraints: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
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
        scannerRef.current = scanner
        try {
          const zoom = scanner.getRunningTrackCameraCapabilities().zoomFeature()
          if (zoom.isSupported()) {
            const min = zoom.min()
            const max = zoom.max()
            const step = zoom.step() > 0 ? zoom.step() : 0.1
            setZoomRange({ min, max, step })
            setZoom(min)
          }
        } catch {
          /* sin soporte de zoom en este dispositivo */
        }
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
      scannerRef.current = null
      if (started && scanner) {
        scanner.stop().catch(() => undefined).then(() => scanner?.clear())
      }
    }
  }, [containerId])

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div id={containerId} className="h-80 w-full overflow-hidden rounded-xl bg-black/80" />
        {status === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-sm text-white">
            <Loader2Icon className="mr-2 size-4 animate-spin" />
            Iniciando cámara…
          </div>
        )}
      </div>

      {status === "ready" && (
        <p className="text-xs text-muted-foreground">
          Apunta al código y espera. Si no lo lee, aléjate/acerca o usa el zoom.
        </p>
      )}

      {zoomRange && status === "ready" && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium">Zoom</span>
          <input
            type="range"
            min={zoomRange.min}
            max={zoomRange.max}
            step={zoomRange.step}
            value={zoom}
            onChange={(e) => handleZoom(Number(e.target.value))}
            className="h-2 w-full cursor-pointer accent-teal-600"
            aria-label="Zoom de la cámara"
          />
          <span className="w-10 shrink-0 text-right text-xs tabular-nums opacity-80">
            {zoom.toFixed(zoom < 10 ? 1 : 0)}×
          </span>
        </div>
      )}

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