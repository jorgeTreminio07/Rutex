"use client"

import { BluetoothIcon, Loader2Icon, PrinterIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  isWebBluetoothSupported,
  requestReceiptPrinter,
  type ReceiptPrinter,
} from "@/features/printing/lib/bluetooth"
import { buildReceiptBlocks, encodeReceiptEscPos, type ReceiptPaperSize } from "@/features/printing/lib/receipt"
import type { OrderDto } from "@/types/interfaces/order.interface"
import type { StoreProfileDto } from "@/types/interfaces/store.interface"
import { cn } from "@/lib/utils"

interface ReceiptPrintViewProps {
  store: StoreProfileDto | null | undefined
  order: OrderDto
  size: ReceiptPaperSize
}

export function ReceiptPrintView({ store, order, size }: ReceiptPrintViewProps) {
  const blocks = useMemo(
    () => buildReceiptBlocks(store ?? {}, order, size),
    [store, order, size],
  )
  const [printer, setPrinter] = useState<ReceiptPrinter | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [bluetoothOff, setBluetoothOff] = useState(false)

  useEffect(() => {
    let cancelled = false
    const getAvailability = navigator.bluetooth?.getAvailability
    if (typeof getAvailability === "function") {
      getAvailability
        .call(navigator.bluetooth)
        .then((available) => {
          if (!cancelled) setBluetoothOff(!available)
        })
        .catch(() => {})
    }
    return () => {
      cancelled = true
    }
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)
    try {
      const next = await requestReceiptPrinter()
      setPrinter(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar la impresora.")
    } finally {
      setConnecting(false)
    }
  }

  const handlePrint = async () => {
    if (!printer) return
    setPrinting(true)
    setError(null)
    try {
      await printer.write(encodeReceiptEscPos(store ?? {}, order, size))
      toast.success("Recibo enviado a la impresora")
    } catch {
      setError("No se pudo imprimir. Verifica que la impresora siga conectada.")
    } finally {
      setPrinting(false)
    }
  }

  useEffect(() => {
    return () => {
      printer?.disconnect()
    }
  }, [printer])

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl bg-muted/50 p-4">
        <div
          className="mx-auto bg-white px-3 py-4 font-mono text-[9.5px] tabular-nums leading-[1.35] text-neutral-900 shadow-sm"
          style={{ width: `${size.widthMm}mm`, maxWidth: "20rem" }}
          aria-label="Vista previa del recibo"
        >
          {blocks.map((block, index) => (
            <div
              key={index}
              className={cn(
                "whitespace-pre",
                block.align === "center" && "text-center",
                block.align === "right" && "text-right",
                block.bold && "font-bold",
                block.double && "text-[12px] font-extrabold",
              )}
            >
              {block.text}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">Impresora</span>
          {printer ? (
            <span className="inline-flex max-w-[60%] items-center gap-1.5 truncate rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <span className="size-1.5 shrink-0 rounded-full bg-current" />
              {printer.name}
            </span>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleConnect}
              disabled={connecting}
            >
              <BluetoothIcon className="size-4" />
              {connecting ? "Buscando…" : "Seleccionar impresora"}
            </Button>
          )}
        </div>

        {!isWebBluetoothSupported() && (
          <p className="text-xs text-muted-foreground">
            Tu navegador no soporta Web Bluetooth. Usa <span className="font-medium">Chrome</span> o{" "}
            <span className="font-medium">Edge</span> para imprimir por Bluetooth.
          </p>
        )}

        {bluetoothOff && (
          <p className="text-xs font-medium text-amber-600">
            Chrome no detecta todavía el Bluetooth de la PC (puede ser el permiso inicial). Pulsa
            igualmente el botón: Chrome te pedirá permiso y mostrará las impresoras cercanas.
          </p>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        {printer && (
          <Button
            type="button"
            className="gap-2"
            onClick={handlePrint}
            disabled={printing}
          >
            {printing ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                Imprimiendo…
              </>
            ) : (
              <>
                <PrinterIcon className="size-4" />
                Imprimir recibo
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}