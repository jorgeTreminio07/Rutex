import { apiClient } from "@/lib/api-client"
import { appendListParams, type ListQueryParams } from "@/lib/query-params"
import type {
  ClientDto,
  CreateClientPayload,
  UpdateClientPayload,
} from "@/types/interfaces/client.interface"
import type { PaginatedResult } from "@/types/interfaces/pagination.interface"

export type { CreateClientPayload, UpdateClientPayload }

export type GetClientsParams = ListQueryParams

function buildQueryString(params: GetClientsParams): string {
  const url = new URL("/api/clients", window.location.origin)
  appendListParams(url, params)
  return url.pathname + url.search
}

export async function getClientsRequest(): Promise<ClientDto[]> {
  return apiClient.get<ClientDto[]>("/api/clients")
}

export async function getClientsListRequest(
  params: GetClientsParams,
): Promise<PaginatedResult<ClientDto>> {
  return apiClient.get<PaginatedResult<ClientDto>>(buildQueryString(params))
}

export async function createClientRequest(payload: CreateClientPayload): Promise<ClientDto> {
  return apiClient.post<ClientDto>("/api/clients", payload)
}

export async function updateClientRequest(
  id: string,
  payload: UpdateClientPayload,
): Promise<ClientDto> {
  return apiClient.put<ClientDto>(`/api/clients/${id}`, payload)
}

export async function deleteClientRequest(id: string): Promise<void> {
  return apiClient.delete(`/api/clients/${id}`)
}