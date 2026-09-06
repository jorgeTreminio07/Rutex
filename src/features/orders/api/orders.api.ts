import { apiClient } from "@/lib/api-client"
import type { OrderDto, CreateOrderPayload } from "@/types/interfaces/order.interface"

export type OrderStatusFilter = "todos" | "en_proceso" | "aprobado" | "rechazado"

export interface GetOrdersParams {
  status?: OrderStatusFilter
  date?: string
  search?: string
}

function buildQueryString(params: GetOrdersParams): string {
  const url = new URL("/api/orders", window.location.origin)
  if (params.status && params.status !== "todos") {
    url.searchParams.set("status", params.status)
  }
  if (params.date) {
    url.searchParams.set("date", params.date)
  }
  if (params.search) {
    url.searchParams.set("search", params.search)
  }
  return url.pathname + url.search
}

export async function getOrdersRequest(params: GetOrdersParams = {}): Promise<OrderDto[]> {
  return apiClient.get<OrderDto[]>(buildQueryString(params))
}

export async function createOrderRequest(payload: CreateOrderPayload): Promise<OrderDto> {
  return apiClient.post<OrderDto>("/api/orders", payload)
}

export async function updateOrderStatusRequest(id: string, statusId: number): Promise<OrderDto> {
  return apiClient.put<OrderDto>(`/api/orders/${id}`, { statusId })
}

export async function deleteOrderRequest(id: string): Promise<void> {
  return apiClient.delete(`/api/orders/${id}`)
}
