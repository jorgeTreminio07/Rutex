import type { OrderDto } from "@/types/interfaces/order.interface"
import type { StoreProfileDto } from "@/types/interfaces/store.interface"
import { formatQty } from "@/lib/format"
import { encodeEscPos, type ReceiptBlock } from "@/features/printing/lib/escape-pos"
import { NICARAGUA_TIME_ZONE } from "@/features/deliveries/lib/format"

// Tamaños de papel térmico soportados.
// 58 mm ≈ 32 caracteres/línea (fuente A); 80 mm ≈ 48 caracteres/línea (fuente A).
export interface ReceiptPaperSize {
  widthMm: number
  chars: number
  label: string
}

export const RECEIPT_PAPER_WIDTHS = [58, 80] as const
export type ReceiptPaperWidth = (typeof RECEIPT_PAPER_WIDTHS)[number]

export const RECEIPT_PAPER_SIZES: Record<ReceiptPaperWidth, ReceiptPaperSize> = {
  58: { widthMm: 58, chars: 32, label: "58 mm" },
  80: { widthMm: 80, chars: 48, label: "80 mm" },
}

// La impresora de la tienda usa papel de 58 mm.
const DEFAULT_PAPER = RECEIPT_PAPER_SIZES[58]

function columnsFor(chars: number): { qtyWidth: number; valueWidth: number } {
  return chars <= 32 ? { qtyWidth: 5, valueWidth: 10 } : { qtyWidth: 5, valueWidth: 11 }
}

function separator(chars: number): string {
  return "-".repeat(chars)
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) : text
}

function fitWidth(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

// Parte un texto largo en varias líneas, cortando en el último espacio que
// quepa antes del límite (word-wrap). Palabras más largas que el límite se
// recortan con "…".
function wrapLines(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text]

  const lines: string[] = []
  const words = text.split(" ")
  let current = ""

  for (const word of words) {
    if (word.length > maxChars) {
      if (current) {
        lines.push(current)
        current = ""
      }
      lines.push(fitWidth(word, maxChars))
      continue
    }

    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)
  return lines
}

function pushWrapped(
  blocks: ReceiptBlock[],
  text: string,
  maxChars: number,
  overrides?: Pick<ReceiptBlock, "align" | "bold" | "double">,
): void {
  for (const line of wrapLines(text, maxChars)) {
    blocks.push({ text: line, ...overrides })
  }
}

// Fecha y hora del pedido en Nicaragua (UTC-6) (ej. 09/09/2026, 19:25).
function formatNicaDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString("es-NI", {
    timeZone: NICARAGUA_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function formatItemLine(quantity: string, description: string, value: string, chars: number): string {
  const { qtyWidth, valueWidth } = columnsFor(chars)
  const descWidth = chars - qtyWidth - 1 - 1 - valueWidth
  const qty = quantity.padStart(qtyWidth)
  const desc = truncate(description, descWidth).padEnd(descWidth)
  const amount = value.padStart(valueWidth)
  return `${qty} ${desc} ${amount}`
}

function formatTotalLine(total: number, chars: number): string {
  const label = "TOTAL"
  const value = `C$ ${total.toFixed(2)}`
  return label + value.padStart(chars - label.length)
}

export function buildReceiptBlocks(
  store: Partial<StoreProfileDto>,
  order: OrderDto,
  size: ReceiptPaperSize = DEFAULT_PAPER,
): ReceiptBlock[] {
  const chars = size.chars
  const blocks: ReceiptBlock[] = []

  if (store.name) {
    pushWrapped(blocks, store.name, Math.floor(chars / 2), {
      align: "center",
      bold: true,
      double: true,
    })
  }
  if (store.address) {
    pushWrapped(blocks, store.address, chars, { align: "center" })
  }
  blocks.push({ text: " " })
  blocks.push({ text: separator(chars) })

  if (order.createdAt) {
    blocks.push({ text: `Fecha: ${formatNicaDateTime(order.createdAt)}` })
  }
  if (order.orderNumber) {
    pushWrapped(blocks, `Pedido: ${order.orderNumber}`, chars)
  }
  pushWrapped(blocks, `Cliente: ${order.customerName}`, chars)
  if (order.customerAddress?.trim()) {
    pushWrapped(blocks, `Dirección: ${order.customerAddress.trim()}`, chars)
  }
  pushWrapped(blocks, `Vendedor: ${store.ownerName ?? "—"}`, chars)
  if (store.phone) {
    pushWrapped(blocks, `Tel: ${store.phone}`, chars)
  }
  blocks.push({ text: separator(chars) })

  blocks.push({ text: formatItemLine("Cant", "Descripción", "Valor", chars), bold: true })

  for (const item of order.items) {
    blocks.push({
      text: formatItemLine(
        formatQty(item.quantity),
        item.productName,
        `C$ ${(item.price * item.quantity).toFixed(2)}`,
        chars,
      ),
    })
  }

  blocks.push({ text: separator(chars) })
  blocks.push({ text: formatTotalLine(order.total, chars), bold: true })
  blocks.push({ text: " " })
  blocks.push({ text: "Muchas gracias!", align: "center", bold: true })

  return blocks
}

export function encodeReceiptEscPos(
  store: Partial<StoreProfileDto>,
  order: OrderDto,
  size: ReceiptPaperSize = DEFAULT_PAPER,
): Uint8Array {
  return encodeEscPos(buildReceiptBlocks(store, order, size), size.chars)
}