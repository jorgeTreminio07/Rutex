import type { DeliveryDto, DeliveryItemDto } from "@/types/interfaces/delivery.interface"

export const DELIVERY_SELECT =
  "id, order_id, status_id, entered_at, created_at, updated_at, orders!inner(order_number, customer_name, customer_phone, items), delivery_statuses!inner(name)"

interface DeliveryOrderRow {
  order_number: string
  customer_name: string
  customer_phone: string | null
  items: unknown
}

export interface DeliveryRow {
  id: string
  order_id: string
  status_id: number
  entered_at: string
  created_at: string
  updated_at: string | null
  orders: DeliveryOrderRow | DeliveryOrderRow[]
  delivery_statuses: { name: string } | { name: string }[]
}

function single<T>(value: T | T[]): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export function mapDelivery(row: DeliveryRow): DeliveryDto {
  const order = single(row.orders)
  const status = single(row.delivery_statuses)

  const items = Array.isArray(order?.items)
    ? (order!.items as Array<{ productId?: string; productName?: string; quantity?: number }>)
        .filter((item) => item && item.productId)
        .map<DeliveryItemDto>((item) => ({
          productId: item.productId!,
          productName: item.productName ?? "Producto",
          quantity: Number(item.quantity) || 0,
        }))
    : []

  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: order?.order_number ?? "",
    customerName: order?.customer_name ?? "",
    customerPhone: order?.customer_phone ?? null,
    items,
    statusId: row.status_id,
    status: status?.name ?? "En almacén",
    enteredAt: row.entered_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}