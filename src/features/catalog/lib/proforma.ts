import { jsPDF } from "jspdf"

import type { BankAccountInfo } from "@/features/catalog/lib/whatsapp"
import type { OrderItem, PaymentType } from "@/types/interfaces/order.interface"

export interface ProformaData {
  storeName: string
  storeAddress?: string | null
  storePhone?: string | null
  customerName: string
  customerPhone: string
  orderNumber?: string | null
  items: OrderItem[]
  total: number
  paymentType: PaymentType
  bankAccounts?: BankAccountInfo[]
}

function setFont(doc: jsPDF, style: "normal" | "bold" | "italic" = "normal", size = 10) {
  doc.setFont("helvetica", style)
  doc.setFontSize(size)
}

export function generateProformaPdf(data: ProformaData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 16

  const dateStr = new Date().toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  let y = 18

  doc.setFillColor(16, 185, 129)
  doc.rect(0, 0, pageWidth, 4, "F")

  setFont(doc, "bold", 18)
  doc.setTextColor(17, 24, 39)
  doc.text(data.storeName || "Rutex", margin, y)

  setFont(doc, "normal", 9)
  doc.setTextColor(100, 116, 139)
  if (data.storeAddress) doc.text(data.storeAddress, margin, y + 5)
  if (data.storePhone) doc.text(`Tel: ${data.storePhone}`, margin, y + 9)

  setFont(doc, "bold", 13)
  doc.setTextColor(16, 185, 129)
  if (data.orderNumber) {
    doc.text(data.orderNumber, pageWidth - margin, y, { align: "right" })
  }
  setFont(doc, "normal", 9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Fecha: ${dateStr}`, pageWidth - margin, y + 5, { align: "right" })

  y += 24

  setFont(doc, "bold", 11)
  doc.setTextColor(17, 24, 39)
  doc.text("PROFORMA", margin, y)
  y += 7

  setFont(doc, "bold", 9)
  doc.text("Facturar a:", margin, y)
  setFont(doc, "normal", 9)
  doc.text(data.customerName, margin, y + 4.5)
  doc.text(`Tel: ${data.customerPhone || "—"}`, margin, y + 9)

  y += 20

  const tableLeft = margin
  let colX = tableLeft
  const colWidths: Array<[string, number]> = [
    ["Producto", pageWidth - margin - (margin + 42 + 34)],
    ["Cant.", 42],
    ["Importe", 34],
  ]
  const colXs: number[] = []
  colWidths.forEach(([, w]) => {
    colXs.push(colX)
    colX += w
  })

  doc.setFillColor(241, 245, 249)
  doc.rect(tableLeft - 2, y - 4.5, pageWidth - margin * 2 + 4, 8, "F")
  setFont(doc, "bold", 9)
  doc.setTextColor(51, 65, 85)
  colXs.forEach((x, i) => {
    doc.text(colWidths[i][0], x, y, { align: i === 0 ? "left" : "right" })
  })

  y += 7
  setFont(doc, "normal", 9)
  doc.setTextColor(17, 24, 39)

  data.items.forEach((item) => {
    if (y > pageHeight - 30) {
      doc.addPage()
      y = 18
    }
    const descriptionX = colXs[0]
    const quantityX = colXs[1]
    const amountX = colXs[2]
    const itemTotal = item.price * item.quantity
    doc.text(item.productName.substring(0, 46), descriptionX, y)
    doc.text(String(item.quantity), quantityX, y, { align: "right" })
    doc.text(`C$ ${itemTotal.toFixed(2)}`, amountX, y, { align: "right" })
    y += 6
  })

  y += 4

  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y - 2, pageWidth - margin, y - 2)
  y += 2

  setFont(doc, "bold", 11)
  doc.setTextColor(16, 185, 129)
  doc.text(`TOTAL: C$ ${data.total.toFixed(2)}`, pageWidth - margin, y, { align: "right" })

  y += 8
  setFont(doc, "normal", 8)
  doc.setTextColor(100, 116, 139)
  doc.text(formatPaymentText(data.paymentType, data.total), pageWidth - margin, y, { align: "right" })

  y += 14

  if (data.bankAccounts && data.bankAccounts.length > 0) {
    setFont(doc, "bold", 9)
    doc.setTextColor(17, 24, 39)
    doc.text("Datos Bancarios:", margin, y)
    y += 5
    setFont(doc, "normal", 9)
    data.bankAccounts.forEach((acc) => {
      doc.text(
        `${acc.bankName} (${acc.currency}): ${acc.accountNumber}${acc.accountHolder ? `  -  Titular: ${acc.accountHolder}` : ""}`,
        margin,
        y,
      )
      y += 5
    })
  }

  const footer = `Gracias por su preferencia. Sírvase presentar esta proforma al momento del pago.`
  setFont(doc, "italic", 8)
  doc.setTextColor(148, 163, 184)
  doc.text(footer, margin, pageHeight - 12)

  return doc
}

function formatPaymentText(paymentType: PaymentType, total: number): string {
  if (paymentType === "cuotas_2") return `2 pagos quincenales de C$ ${(total / 2).toFixed(2)}`
  if (paymentType === "cuotas_4") return `4 pagos semanales de C$ ${(total / 4).toFixed(2)}`
  return "Pago de contado"
}