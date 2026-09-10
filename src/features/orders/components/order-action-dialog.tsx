"use client"

import { AirplayIcon, Loader2Icon, MessageSquareTextIcon, PrinterIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  generateProformaCustomerMessage,
  sanitizePhoneNumber,
  type BankAccountInfo,
} from "@/features/catalog/lib/whatsapp"
import { uploadReceiptRequest } from "@/features/printing/api/receipts.api"
import { ReceiptPrintView } from "@/features/printing/components/receipt-print-view"
import { generateReceiptPdf } from "@/features/printing/lib/receipt-pdf"
import { useStore } from "@/features/store/hooks/use-store"
import type { OrderDto } from "@/types/interfaces/order.interface"

interface OrderActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: OrderDto | null
  onComplete: () => void
}

export function OrderActionDialog({
  open,
  onOpenChange,
  order,
  onComplete,
}: OrderActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className="sm:max-w-md">
        {order && (
          <OrderActionBody
            key={order.id}
            order={order}
            onComplete={onComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function OrderActionBody({
  order,
  onComplete,
}: {
  order: OrderDto
  onComplete: () => void
}) {
  const { data: store } = useStore()
  const [step, setStep] = useState<"choice" | "print">("choice")
  const [printing, setPrinting] = useState(false)

  const bankAccounts: BankAccountInfo[] = (store?.bankAccounts ?? []).map((a) => ({
    bankName: a.bankName,
    accountNumber: a.accountNumber,
    accountHolder: a.accountHolder,
    currency: a.currency,
  }))

  const handlePrint = async () => {
    if (printing) return
    setPrinting(true)

    // Abre la pestaña ahora (gesto del usuario), para que el navegador no la
    // bloquee; la URL se asigna cuando termine de subir el PDF.
    const popup = window.open("", "_blank")

    try {
      const pdf = generateReceiptPdf(store ?? {}, order)
      const blob = new Blob([pdf.output("blob")], { type: "application/pdf" })
      const uploaded = await uploadReceiptRequest(blob, order.orderNumber ?? "recibo")

      if (popup) {
        popup.location.href = uploaded.url
      } else {
        window.open(uploaded.url, "_blank")
      }

      onComplete()
    } catch {
      popup?.close()
      toast.error("No se pudo generar el recibo. Intenta de nuevo.")
    } finally {
      setPrinting(false)
    }
  }

  const handleSendMessage = () => {
    const msg = generateProformaCustomerMessage({
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      total: order.total,
      proformaUrl: order.proformaUrl ?? "",
      bankAccounts,
    })

    const destPhone = sanitizePhoneNumber(order.customerPhone ?? "")
    window.open(`https://wa.me/${destPhone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer")

    onComplete()
  }

  if (step === "choice") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Pedido registrado</DialogTitle>
          <DialogDescription>
            El pedido{" "}
            <span className="font-mono font-medium text-foreground">{order.orderNumber}</span> se guardó
            y su proforma ya está generada. ¿Qué deseas hacer con el cliente?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            type="button"
            size="lg"
            className="justify-start gap-3"
            onClick={handleSendMessage}
          >
            <MessageSquareTextIcon className="size-5" />
            Enviar mensaje con proforma
          </Button>
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="justify-start gap-3"
            onClick={() => setStep("print")}
          >
            <PrinterIcon className="size-5" />
            Imprimir recibo
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-2 pr-6">
          <AirplayIcon className="size-4 text-muted-foreground" />
          <DialogTitle className="text-base">Imprimir recibo</DialogTitle>
          <Badge variant="secondary">80 mm</Badge>
        </div>
        <DialogDescription>
          Así se verá el recibo (80 mm). Al pulsar {"“Proceder con impresión”"} se guarda el PDF y
          se abre en una pestaña nueva para imprimirlo desde el navegador.
        </DialogDescription>
      </DialogHeader>

      <div className="pt-1">
        <ReceiptPrintView store={store} order={order} />
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" onClick={() => setStep("choice")}>
          Volver
        </Button>
        <Button type="button" size="sm" onClick={handlePrint} disabled={printing} className="gap-2">
          {printing ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              Generando…
            </>
          ) : (
            <>
              <PrinterIcon className="size-4" />
              Proceder con impresión
            </>
          )}
        </Button>
      </div>
    </>
  )
}