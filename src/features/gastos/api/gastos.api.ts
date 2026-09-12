import { apiClient } from "@/lib/api-client"
import type {
  CreateGastoPayload,
  GastoDto,
  UpdateGastoPayload,
} from "@/types/interfaces/gasto.interface"

export type { CreateGastoPayload, UpdateGastoPayload }

export async function getGastosRequest(): Promise<GastoDto[]> {
  return apiClient.get<GastoDto[]>("/api/gastos")
}

export async function createGastoRequest(payload: CreateGastoPayload): Promise<GastoDto> {
  return apiClient.post<GastoDto>("/api/gastos", payload)
}

export async function updateGastoRequest(
  id: string,
  payload: UpdateGastoPayload,
): Promise<GastoDto> {
  return apiClient.put<GastoDto>(`/api/gastos/${id}`, payload)
}

export async function deleteGastoRequest(id: string): Promise<void> {
  return apiClient.delete(`/api/gastos/${id}`)
}

export async function uploadGastoReceiptRequest(
  file: File,
  name: string,
): Promise<{ url: string; path: string }> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("name", name)
  return apiClient.post<{ url: string; path: string }>("/api/gastos/receipts", formData)
}