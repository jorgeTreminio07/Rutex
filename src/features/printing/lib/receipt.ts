import type { OrderDto } from "@/types/interfaces/order.interface"
import type { StoreProfileDto } from "@/types/interfaces/store.interface"
import { NICARAGUA_TIME_ZONE } from "@/features/deliveries/lib/format"

// Ancho de papel del recibo. La tienda usa 80 mm (≈48 caracteres/línea, fuente A).
export const RECEIPT_PAPER_WIDTH = 80
export const RECEIPT_CHARS = 48

export interface ReceiptBlock {
  text: string
  align?: "left" | "center" | "right"
  bold?: boolean
  double?: boolean
}

function separator(): string {
  return "-".repeat(RECEIPT_CHARS)
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) : text
}

function fitWidth(text: string, max: number): string {
  if (text.length <= max) return text
  return `${text.slice(0, max - 1)}…`
}

// Fecha del pedido en Nicaragua (UTC-6), sin hora (ej. 09/09/2026).
function formatNicaDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("es-NI", {
    timeZone: NICARAGUA_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

function formatItemLine(quantity: string, description: string, value: string): string {
  const qtyWidth = 5
  const valueWidth = 11
  const descWidth = RECEIPT_CHARS - qtyWidth - 1 - 1 - valueWidth
  const qty = quantity.padStart(qtyWidth)
  const desc = truncate(description, descWidth).padEnd(descWidth)
  const amount = value.padStart(valueWidth)
  return `${qty} ${desc} ${amount}`
}

function formatTotalLine(total: number): string {
  const label = "TOTAL"
  const value = `C$ ${total.toFixed(2)}`
  return label + value.padStart(RECEIPT_CHARS - label.length)
}

export function buildReceiptBlocks(
  store: Partial<StoreProfileDto>,
  order: OrderDto,
): ReceiptBlock[] {
  const blocks: ReceiptBlock[] = []

  if (store.name) {
    blocks.push({ text: fitWidth(store.name, 24), align: "center", bold: true, double: true })
  }
  if (store.address) {
    blocks.push({ text: fitWidth(store.address, 48), align: "center" })
  }
  blocks.push({ text: " " })
  blocks.push({ text: separator() })

  if (order.createdAt) {
    blocks.push({ text: `Fecha: ${formatNicaDate(order.createdAt)}` })
  }
  if (order.orderNumber) {
    blocks.push({ text: `Pedido: ${order.orderNumber}` })
  }
  blocks.push({ text: `Vendedor: ${fitWidth(store.ownerName ?? "—", 41)}` })
  if (store.phone) {
    blocks.push({ text: `Tel: ${fitWidth(store.phone, 44)}` })
  }
  blocks.push({ text: separator() })

  blocks.push({ text: formatItemLine("Cant", "Descripción", "Valor"), bold: true })

  for (const item of order.items) {
    blocks.push({
      text: formatItemLine(
        String(item.quantity),
        item.productName,
        `C$ ${(item.price * item.quantity).toFixed(2)}`,
      ),
    })
  }

  blocks.push({ text: separator() })
  blocks.push({ text: formatTotalLine(order.total), bold: true })
  blocks.push({ text: " " })
  blocks.push({ text: "¡Muchas gracias!", align: "center", bold: true })

  return blocks
}