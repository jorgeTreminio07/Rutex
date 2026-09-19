import type { CartLine } from "@/features/catalog/store/use-cart-store"
import type { OrderItem, PaymentType } from "@/types/interfaces/order.interface"
import type { ProductDto } from "@/types/interfaces/product.interface"
import { fmtMoney, formatQty } from "@/lib/format"

export interface BankAccountInfo {
  bankName: string
  accountNumber: string
  accountHolder: string | null
  currency: string
}

export function sanitizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, "")
  if (cleaned.length === 8) {
    cleaned = "505" + cleaned
  }
  return cleaned
}

export function getEffectivePrice(product: ProductDto): number {
  if (product.discountPercent && product.discountPercent > 0) {
    return product.price * (1 - product.discountPercent / 100)
  }
  return product.price
}

export function cartToOrderItems(lines: CartLine[]): OrderItem[] {
  return lines.map((line) => ({
    productId: line.product.id,
    productName: line.product.name,
    price: getEffectivePrice(line.product),
    quantity: line.quantity,
  }))
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + getEffectivePrice(line.product) * line.quantity, 0)
}

export function formatPaymentMethodText(paymentType: PaymentType, total: number): string {
  if (paymentType === "cuotas_2") {
    return `A cuotas - 2 pagos quincenales de ${fmtMoney(total / 2)} c/u`
  }
  if (paymentType === "cuotas_4") {
    return `A cuotas - 4 pagos semanales de ${fmtMoney(total / 4)} c/u`
  }
  return `De contado (1 solo pago de ${fmtMoney(total)})`
}

export function formatBankAccountsText(bankAccounts?: BankAccountInfo[]): string {
  if (!bankAccounts || bankAccounts.length === 0) return ""
  const valid = bankAccounts.filter((a) => a.bankName?.trim() || a.accountNumber?.trim())
  if (valid.length === 0) return ""
  return valid
    .map((a) => {
      let line = `*${a.bankName || "Banco"}*`
      if (a.currency?.trim()) line += ` (${a.currency.trim()})`
      line += `: ${a.accountNumber || "—"}`
      if (a.accountHolder?.trim()) line += `\n  *Titular:* ${a.accountHolder.trim()}`
      return line
    })
    .join("\n")
}

export interface ProformaCustomerMessagePayload {
  customerName: string
  orderNumber?: string | null
  total: number
  proformaUrl: string
  bankAccounts?: BankAccountInfo[]
}

export function generateProformaCustomerMessage(
  payload: ProformaCustomerMessagePayload,
): string {
  const { customerName, orderNumber, total, proformaUrl, bankAccounts } = payload
  const bankText =
    bankAccounts && bankAccounts.length > 0
      ? bankAccounts
          .map((a) => `• ${a.bankName} (${a.currency}): ${a.accountNumber}`)
          .join("\n")
      : "En efectivo al recibir."
  return `Hola ${customerName}, le enviamos la *PROFORMA* de su pedido *${orderNumber ?? ""}* por ${fmtMoney(total)}.\n\nPuede descargarla aquí: ${proformaUrl}\n\n*Métodos de pago:*\n${bankText}\n\nQuedamos a la espera de su confirmación. ¡Gracias!`
}

export interface OrderMessagePayload {
  customerName: string
  customerPhone: string
  items: OrderItem[]
  total: number
  orderNumber?: string
  paymentType?: PaymentType
  targetPhoneNumber?: string
}

export function generateOrderWhatsAppUrl(payload: OrderMessagePayload): string {
  const { customerName, customerPhone, items, total, orderNumber, paymentType = "contado" } = payload
  let text = `*NUEVO PEDIDO DE COMPRA*\n\n`
  if (orderNumber) {
    text += `*Solicitud N°:* ${orderNumber}\n`
  }
  text += `*Cliente:* ${customerName}\n`
  text += `*Teléfono:* ${customerPhone}\n`
  text += `*Modalidad de Pago Solicitada:* ${formatPaymentMethodText(paymentType, total)}\n\n`
  text += `*Detalle del Pedido:*\n`

  items.forEach((item) => {
    const unitPrice = item.price
    const itemTotal = unitPrice * item.quantity
    text += `• ${formatQty(item.quantity)}x ${item.productName} - ${fmtMoney(unitPrice)} c/u (${fmtMoney(itemTotal)})\n`
  })

  text += `\n*Total a pagar:* ${fmtMoney(total)}\n`
  text += `\nQuedo a la espera de la confirmación de mi pedido. Gracias.`

  const destPhone = sanitizePhoneNumber(payload.targetPhoneNumber || "")
  return `https://wa.me/${destPhone}?text=${encodeURIComponent(text)}`
}

export interface ApprovalMessagePayload {
  order: {
    id: string
    orderNumber: string | null
    customerName: string
    customerPhone: string | null
    items: OrderItem[]
    total: number
    paymentType?: PaymentType
    createdAt?: string
  }
  bankAccounts?: BankAccountInfo[]
  proformaUrl?: string
}

export function generateApprovalWhatsAppUrl(payload: ApprovalMessagePayload): string {
  const { order, bankAccounts, proformaUrl } = payload
  const customerPhoneClean = sanitizePhoneNumber(order.customerPhone || "")
  const solicitudNum = order.orderNumber || order.id.slice(0, 8)
  const paymentType = order.paymentType || "contado"

  let text = `*PEDIDO APROBADO*\n\n`
  text += `Hola *${order.customerName}*,\n`
  text += `Nos complace informarle que su solicitud de compra *N° ${solicitudNum}* ha sido *APROBADA*.\n\n`
  text += `*Resumen de su compra:*\n`

  order.items.forEach((item) => {
    text += `• ${formatQty(item.quantity)}x ${item.productName} (${fmtMoney(item.price * item.quantity)})\n`
  })

  text += `\n*Total Final:* ${fmtMoney(order.total)}\n`
  text += `*Modalidad de Pago Aprobada:* ${formatPaymentMethodText(paymentType, order.total)}\n`

  if (paymentType === "cuotas_2" || paymentType === "cuotas_4") {
    const numCuotas = paymentType === "cuotas_2" ? 2 : 4
    const quotaAmount = order.total / numCuotas
    const intervalDays = paymentType === "cuotas_2" ? 15 : 7
    const baseDate = order.createdAt ? new Date(order.createdAt) : new Date()
    text += `\n*Fechas de Pago Programadas:*\n`
    for (let i = 1; i <= numCuotas; i++) {
      const dueDate = new Date(baseDate.getTime() + i * intervalDays * 24 * 60 * 60 * 1000)
      const formattedDate = dueDate.toLocaleDateString("es-NI", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      const periodLabel = paymentType === "cuotas_2" ? `Cuota ${i} (15 días)` : `Cuota ${i} (Semana ${i})`
      text += `• ${periodLabel}: ${formattedDate} - ${fmtMoney(quotaAmount)}\n`
    }
  }

  if (proformaUrl) {
    text += `\n*Proforma:*\n${proformaUrl}\n`
  }

  text += `\n*Métodos de Pago Aceptados:*\n`
  text += `Puede realizar su pago en efectivo o mediante transferencia bancaria a las siguientes cuentas:\n\n`
  const bankText = formatBankAccountsText(bankAccounts)
  if (bankText) {
    text += `${bankText}\n\n`
  }
  text += `Estamos coordinando la entrega de sus productos. Gracias por preferirnos.`

  return `https://wa.me/${customerPhoneClean}?text=${encodeURIComponent(text)}`
}

export function generateRejectionWhatsAppUrl(order: {
  id: string
  orderNumber: string | null
  customerName: string
  customerPhone: string | null
  total: number
}): string {
  const customerPhoneClean = sanitizePhoneNumber(order.customerPhone || "")
  const solicitudNum = order.orderNumber || order.id.slice(0, 8)

  let text = `*INFORMACIÓN DE SU PEDIDO*\n\n`
  text += `Hola *${order.customerName}*,\n`
  text += `Le informamos sobre su solicitud de compra *N° ${solicitudNum}* por ${fmtMoney(order.total)}.\n`
  text += `Lamentablemente en este momento no ha podido ser procesada. Si tiene dudas, contáctenos directamente por este medio.`

  return `https://wa.me/${customerPhoneClean}?text=${encodeURIComponent(text)}`
}