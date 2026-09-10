import { jsPDF } from "jspdf"

import type { OrderDto } from "@/types/interfaces/order.interface"
import type { StoreProfileDto } from "@/types/interfaces/store.interface"
import { buildReceiptBlocks } from "@/features/printing/lib/receipt"

// Página del recibo del mismo ancho que el papel térmico de 80 mm.
export const RECEIPT_PAGE_WIDTH_MM = 80
const RECEIPT_PAGE_HEIGHT_PADDING_MM = 6
const BODY_FONT_PT = 7
const MM_PER_PT = 0.352778
const LINE_HEIGHT_FACTOR = 1.4

function lineHeightMm(double: boolean): number {
  const size = double ? BODY_FONT_PT * 2 : BODY_FONT_PT
  return size * LINE_HEIGHT_FACTOR * MM_PER_PT
}

export function generateReceiptPdf(
  store: Partial<StoreProfileDto>,
  order: OrderDto,
): jsPDF {
  const blocks = buildReceiptBlocks(store, order)

  let height = RECEIPT_PAGE_HEIGHT_PADDING_MM * 2
  for (const block of blocks) {
    height += lineHeightMm(Boolean(block.double))
  }

  const doc = new jsPDF({
    unit: "mm",
    format: [RECEIPT_PAGE_WIDTH_MM, height],
    compress: true,
  })

  doc.setFont("courier", "normal")
  doc.setTextColor(0, 0, 0)

  let y = RECEIPT_PAGE_HEIGHT_PADDING_MM
  for (const block of blocks) {
    const double = Boolean(block.double)
    y += lineHeightMm(double)

    doc.setFont("courier", block.bold ? "bold" : "normal")
    doc.setFontSize(double ? BODY_FONT_PT * 2 : BODY_FONT_PT)

    const align = block.align === "center" ? "center" : block.align === "right" ? "right" : "left"
    const x = align === "center" ? RECEIPT_PAGE_WIDTH_MM / 2 : align === "right" ? RECEIPT_PAGE_WIDTH_MM - 1 : 1
    doc.text(block.text, x, y, { align })
  }

  return doc
}