import { apiClient } from "@/lib/api-client"
import { appendListParams, type ListQueryParams } from "@/lib/query-params"
import type {
  CreateInventoryPayload,
  InventoryDto,
  UpdateInventoryPayload,
} from "@/types/interfaces/inventory.interface"
import type { PaginatedResult } from "@/types/interfaces/pagination.interface"

export type { CreateInventoryPayload, UpdateInventoryPayload }

export type GetInventoriesParams = ListQueryParams

function buildQueryString(params: GetInventoriesParams): string {
  const url = new URL("/api/inventories", window.location.origin)
  appendListParams(url, params)
  return url.pathname + url.search
}

export async function getInventoriesRequest(
  params: GetInventoriesParams = {},
): Promise<PaginatedResult<InventoryDto>> {
  return apiClient.get<PaginatedResult<InventoryDto>>(buildQueryString(params))
}

export async function createInventoryRequest(payload: CreateInventoryPayload): Promise<InventoryDto> {
  return apiClient.post<InventoryDto>("/api/inventories", payload)
}

export async function updateInventoryRequest(id: string, payload: UpdateInventoryPayload): Promise<InventoryDto> {
  return apiClient.put<InventoryDto>(`/api/inventories/${id}`, payload)
}