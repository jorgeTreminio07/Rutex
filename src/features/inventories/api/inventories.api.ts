import { apiClient } from "@/lib/api-client"
import type {
  CreateInventoryPayload,
  InventoryDto,
  UpdateInventoryPayload,
} from "@/types/interfaces/inventory.interface"

export type { CreateInventoryPayload, UpdateInventoryPayload }

export async function getInventoriesRequest(): Promise<InventoryDto[]> {
  return apiClient.get<InventoryDto[]>("/api/inventories")
}

export async function createInventoryRequest(payload: CreateInventoryPayload): Promise<InventoryDto> {
  return apiClient.post<InventoryDto>("/api/inventories", payload)
}

export async function updateInventoryRequest(id: string, payload: UpdateInventoryPayload): Promise<InventoryDto> {
  return apiClient.put<InventoryDto>(`/api/inventories/${id}`, payload)
}