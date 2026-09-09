import { apiClient } from "@/lib/api-client"
import type {
  ClientDto,
  CreateClientPayload,
  UpdateClientPayload,
} from "@/types/interfaces/client.interface"

export type { CreateClientPayload, UpdateClientPayload }

export async function getClientsRequest(): Promise<ClientDto[]> {
  return apiClient.get<ClientDto[]>("/api/clients")
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