export interface OrderItem {
  productId: string
  productName: string
  price: number
  quantity: number
}

export type OrderStatus = "En proceso" | "Aprobado" | "Rechazado"
export type PaymentType = "contado" | "cuotas_2" | "cuotas_4"

export interface OrderDto {
  id: string
  orderNumber: string | null
  customerName: string
  customerPhone: string | null
  items: OrderItem[]
  total: number
  statusId: number
  status: OrderStatus
  paymentType: PaymentType
  notes: string | null
  createdAt: string
  canApprove: boolean
}

export interface CreateOrderPayload {
  customerName: string
  customerPhone?: string
  items: OrderItem[]
  total: number
  paymentType?: PaymentType
  notes?: string
}
