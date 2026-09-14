"use client"

import { BluetoothIcon, CheckIcon, CopyIcon, Loader2Icon, PrinterIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  disconnectActiveReceiptPrinter,
  getActiveReceiptPrinter,
  getSavedReceiptPrinter,
  isWebBluetoothSupported,
  reconnectReceiptPrinter,
  requestReceiptPrinter,
  saveReceiptPrinter,
  setActiveReceiptPrinter,
  type ReceiptPrinter,
  type SavedPrinter,
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
  const [remembered, setRemembered] = useState<SavedPrinter | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [bluetoothOff, setBluetoothOff] = useState(false)
  const [copied, setCopied] = useState(false)

  const plainText = useMemo(() => blocks.map((block) => block.text).join("\n"), [blocks])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText)
      setCopied(true)
      toast.success("Texto del recibo copiado")
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setError("No se pudo copiar el texto.")
    }
  }

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

  useEffect(() => {
    let cancelled = false
    // Si ya hay una impresora conectada viva en el módulo (de otro pedido de
    // esta misma sesión) se reutiliza tal cual: sin volver a pedir al navegador.
    const live = getActiveReceiptPrinter()
    const saved = getSavedReceiptPrinter()
    Promise.resolve({ live: live ?? null, saved }).then(({ live: l, saved: s }) => {
      if (cancelled) return
      if (l) {
        setPrinter(l)
        setRemembered({ id: l.id, name: l.name })
        saveReceiptPrinter(l.id, l.name)
      } else if (s) {
        setRemembered(s)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Conecta a la impresora guardada sin abrir el selector (Chrome resuelve
  // directo por id si el permiso ya está concedido); si ya no la encuentra,
  // abre el selector BLE para volver a emparejarla. La conexión se queda como
  // activa en el módulo para reutilizarla en el próximo pedido.
  const pickPrinter = async (): Promise<ReceiptPrinter> => {
    const live = getActiveReceiptPrinter()
    if (live) return live
    let next: ReceiptPrinter
    if (remembered) {
      try {
        next = await reconnectReceiptPrinter(remembered.id)
        setActiveReceiptPrinter(next)
        return next
      } catch {
        // no la encuentra (apagada / fuera de alcance / permiso revocado): pedirla de nuevo
      }
    }
    next = await requestReceiptPrinter()
    setActiveReceiptPrinter(next)
    return next
  }

  const rememberPrinter = (next: ReceiptPrinter) => {
    setPrinter(next)
    setRemembered({ id: next.id, name: next.name })
    saveReceiptPrinter(next.id, next.name)
  }

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)
    try {
      rememberPrinter(await pickPrinter())
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar la impresora.")
    } finally {
      setConnecting(false)
    }
  }

  const handleChangePrinter = async () => {
    setConnecting(true)
    setError(null)
    try {
      const next = await requestReceiptPrinter()
      setActiveReceiptPrinter(next)
      rememberPrinter(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar la impresora.")
    } finally {
      setConnecting(false)
    }
  }

  const handlePrint = async () => {
    if (!getActiveReceiptPrinter() && !remembered) return
    setPrinting(true)
    setError(null)
    try {
      let target = await pickPrinter()
      try {
        await target.write(encodeReceiptEscPos(store ?? {}, order, size))
      } catch {
        // la conexión pudo caerse (impresora apagada / fuera de alcance):
        // descartarla, reconectar a la guardada y reintentar una vez
        disconnectActiveReceiptPrinter()
        target = await pickPrinter()
        await target.write(encodeReceiptEscPos(store ?? {}, order, size))
      }
      rememberPrinter(target)
      toast.success("Recibo enviado a la impresora")
    } catch {
      setError("No se pudo imprimir. Verifica que la impresora siga encendida y cerca.")
    } finally {
      setPrinting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-x-auto rounded-xl bg-muted/50 p-4">
        <div className="mb-2 flex justify-end">
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleCopy}>
            {copied ? <CheckIcon className="size-4 text-emerald-600" /> : <CopyIcon className="size-4" />}
            {copied ? "Copiado" : "Copiar texto"}
          </Button>
        </div>
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
            <div className="flex min-w-0 items-center justify-end gap-1.5">
              <span className="inline-flex min-w-0 items-center gap-1.5 truncate rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                <span className="size-1.5 shrink-0 rounded-full bg-current" />
                <span className="truncate">{printer.name}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-xs"
                onClick={handleChangePrinter}
                disabled={connecting}
              >
                Cambiar
              </Button>
            </div>
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

        {!printer && remembered && (
          <p className="text-xs text-muted-foreground">
            Impresora guardada: <span className="font-medium">{remembered.name}</span>. Al pulsar{" "}
            <span className="font-medium">Imprimir recibo</span> se reconectará sola; solo pedirá
            volver a sincronizarla si ya no la encuentra.
          </p>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        {(printer || remembered) && (
          <Button
            type="button"
            className="gap-2"
            onClick={handlePrint}
            disabled={printing || connecting}
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