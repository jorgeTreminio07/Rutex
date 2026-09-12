import { apiClient } from "@/lib/api-client"
import type {
  SupplierDto,
  CreateSupplierPayload,
  UpdateSupplierPayload,
} from "@/types/interfaces/supplier.interface"

export type { CreateSupplierPayload, UpdateSupplierPayload }

export async function getSuppliersRequest(): Promise<SupplierDto[]> {
  return apiClient.get<SupplierDto[]>("/api/suppliers")
}

export async function createSupplierRequest(payload: CreateSupplierPayload): Promise<SupplierDto> {
  return apiClient.post<SupplierDto>("/api/suppliers", payload)
}

export async function updateSupplierRequest(
  id: string,
  payload: UpdateSupplierPayload,
): Promise<SupplierDto> {
  return apiClient.put<SupplierDto>(`/api/suppliers/${id}`, payload)
}

export async function deleteSupplierRequest(id: string): Promise<void> {
  return apiClient.delete(`/api/suppliers/${id}`)
}