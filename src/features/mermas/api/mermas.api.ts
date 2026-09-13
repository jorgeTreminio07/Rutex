import { apiClient } from "@/lib/api-client"
import { appendListParams, type ListQueryParams } from "@/lib/query-params"
import type {
  CreateMermaPayload,
  MermaDto,
  MermaMotivoDto,
  UpdateMermaPayload,
} from "@/types/interfaces/merma.interface"
import type { PaginatedResult } from "@/types/interfaces/pagination.interface"

export type { CreateMermaPayload, UpdateMermaPayload }

export type GetMermasParams = ListQueryParams

function buildQueryString(params: GetMermasParams): string {
  const url = new URL("/api/mermas", window.location.origin)
  appendListParams(url, params)
  return url.pathname + url.search
}

export async function getMermasRequest(params: GetMermasParams): Promise<PaginatedResult<MermaDto>> {
  return apiClient.get<PaginatedResult<MermaDto>>(buildQueryString(params))
}

export async function getMermaMotivosRequest(): Promise<MermaMotivoDto[]> {
  return apiClient.get<MermaMotivoDto[]>("/api/mermas/motivos")
}

export async function createMermaRequest(payload: CreateMermaPayload): Promise<MermaDto> {
  return apiClient.post<MermaDto>("/api/mermas", payload)
}

export async function updateMermaRequest(id: string, payload: UpdateMermaPayload): Promise<MermaDto> {
  return apiClient.put<MermaDto>(`/api/mermas/${id}`, payload)
}

export async function deleteMermaRequest(id: string): Promise<{ deleted: boolean }> {
  return apiClient.delete<{ deleted: boolean }>(`/api/mermas/${id}`)
}