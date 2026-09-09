export interface DeliveryItemDto {
  productId: string
  productName: string
  quantity: number
}

export interface DeliveryDto {
  id: string
  orderId: string
  orderNumber: string
  customerName: string
  customerPhone: string | null
  items: DeliveryItemDto[]
  statusId: number
  status: string
  enteredAt: string
  createdAt: string
  updatedAt: string | null
}

export type DeliveryStatusFilter = "todos" | "en_almacen" | "en_ruta" | "entregado"

export const DELIVERY_STATUS_OPTIONS: { value: DeliveryStatusFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "en_almacen", label: "En almacén" },
  { value: "en_ruta", label: "En ruta" },
  { value: "entregado", label: "Entregado" },
]

export function matchesDeliveryStatus(statusId: number, filter: DeliveryStatusFilter): boolean {
  if (filter === "todos") return true
  const map: Record<Exclude<DeliveryStatusFilter, "todos">, number> = {
    en_almacen: 1,
    en_ruta: 2,
    entregado: 3,
  }
  return statusId === map[filter as Exclude<DeliveryStatusFilter, "todos">]
}

export function deliveryStatusVariant(statusId: number): "default" | "secondary" | "destructive" | "outline" {
  if (statusId === 3) return "default"
  if (statusId === 2) return "secondary"
  return "outline"
}

export interface NextDeliveryStatus {
  statusId: number
  label: string
}

export function nextDeliveryStatus(statusId: number): NextDeliveryStatus | null {
  if (statusId === 1) return { statusId: 2, label: "En ruta" }
  if (statusId === 2) return { statusId: 3, label: "Entregado" }
  return null
}