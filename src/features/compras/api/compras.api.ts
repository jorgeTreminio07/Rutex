import { apiClient } from "@/lib/api-client"
import type {
  CompraDto,
  CreateCompraPayload,
  UpdateCompraPayload,
} from "@/types/interfaces/compra.interface"

export type { CreateCompraPayload, UpdateCompraPayload }

export async function getComprasRequest(): Promise<CompraDto[]> {
  return apiClient.get<CompraDto[]>("/api/compras")
}

export async function createCompraRequest(payload: CreateCompraPayload): Promise<CompraDto> {
  return apiClient.post<CompraDto>("/api/compras", payload)
}

export async function updateCompraRequest(
  id: string,
  payload: UpdateCompraPayload,
): Promise<CompraDto> {
  return apiClient.put<CompraDto>(`/api/compras/${id}`, payload)
}

export async function deleteCompraRequest(id: string): Promise<void> {
  return apiClient.delete(`/api/compras/${id}`)
}

export async function uploadCompraReceiptRequest(
  file: File,
  name: string,
): Promise<{ url: string; path: string }> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("name", name)
  return apiClient.post<{ url: string; path: string }>("/api/compras/receipts", formData)
}