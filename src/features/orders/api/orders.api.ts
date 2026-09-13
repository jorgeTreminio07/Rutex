import { apiClient } from "@/lib/api-client"
import { appendListParams, type ListQueryParams } from "@/lib/query-params"
import type { OrderDto, CreateOrderPayload } from "@/types/interfaces/order.interface"
import type { PaginatedResult } from "@/types/interfaces/pagination.interface"

export type OrderStatusFilter = "todos" | "en_proceso" | "aprobado" | "rechazado"

export interface GetOrdersParams extends ListQueryParams {
  status?: OrderStatusFilter
  date?: string
  search?: string
}

function buildQueryString(params: GetOrdersParams): string {
  const url = new URL("/api/orders", window.location.origin)
  appendListParams(url, params)
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

export async function getOrdersRequest(
  params: GetOrdersParams = {},
): Promise<PaginatedResult<OrderDto>> {
  return apiClient.get<PaginatedResult<OrderDto>>(buildQueryString(params))
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

export async function saveOrderProformaRequest(
  id: string,
  url: string,
): Promise<{ url: string }> {
  return apiClient.post<{ url: string }>(`/api/orders/${id}/proforma`, { url })
}
