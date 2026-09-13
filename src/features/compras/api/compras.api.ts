import { apiClient } from "@/lib/api-client"
import { appendListParams, type ListQueryParams } from "@/lib/query-params"
import type {
  CompraDto,
  CreateCompraPayload,
  UpdateCompraPayload,
} from "@/types/interfaces/compra.interface"
import type { PaginatedResult } from "@/types/interfaces/pagination.interface"

export type { CreateCompraPayload, UpdateCompraPayload }

export type GetComprasParams = ListQueryParams

function buildQueryString(params: GetComprasParams): string {
  const url = new URL("/api/compras", window.location.origin)
  appendListParams(url, params)
  return url.pathname + url.search
}

export async function getComprasRequest(params: GetComprasParams): Promise<PaginatedResult<CompraDto>> {
  return apiClient.get<PaginatedResult<CompraDto>>(buildQueryString(params))
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