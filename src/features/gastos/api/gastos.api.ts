import { apiClient } from "@/lib/api-client"
import { appendListParams, type ListQueryParams } from "@/lib/query-params"
import type {
  CreateGastoPayload,
  GastoDto,
  UpdateGastoPayload,
} from "@/types/interfaces/gasto.interface"
import type { PaginatedResult } from "@/types/interfaces/pagination.interface"

export type { CreateGastoPayload, UpdateGastoPayload }

export type GetGastosParams = ListQueryParams

function buildQueryString(params: GetGastosParams): string {
  const url = new URL("/api/gastos", window.location.origin)
  appendListParams(url, params)
  return url.pathname + url.search
}

export async function getGastosRequest(params: GetGastosParams): Promise<PaginatedResult<GastoDto>> {
  return apiClient.get<PaginatedResult<GastoDto>>(buildQueryString(params))
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