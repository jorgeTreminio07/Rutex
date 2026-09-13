import { apiClient } from "@/lib/api-client"
import { appendListParams, type ListQueryParams } from "@/lib/query-params"
import type { DeliveryDto } from "@/types/interfaces/delivery.interface"
import type { PaginatedResult } from "@/types/interfaces/pagination.interface"
import type { DeliveryStatusFilter } from "@/types/interfaces/delivery.interface"

export type GetDeliveriesParams = ListQueryParams & { status?: DeliveryStatusFilter }

function buildQueryString(params: GetDeliveriesParams): string {
  const url = new URL("/api/deliveries", window.location.origin)
  appendListParams(url, params)
  if (params.status && params.status !== "todos") {
    url.searchParams.set("status", params.status)
  }
  return url.pathname + url.search
}

export async function getDeliveriesRequest(
  params: GetDeliveriesParams,
): Promise<PaginatedResult<DeliveryDto>> {
  return apiClient.get<PaginatedResult<DeliveryDto>>(buildQueryString(params))
}

export async function advanceDeliveryStatusRequest(id: string, statusId: number): Promise<DeliveryDto> {
  return apiClient.put<DeliveryDto>(`/api/deliveries/${id}`, { statusId })
}