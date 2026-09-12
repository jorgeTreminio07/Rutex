import { apiClient } from "@/lib/api-client"
import type {
  CreateMermaPayload,
  MermaDto,
  MermaMotivoDto,
  UpdateMermaPayload,
} from "@/types/interfaces/merma.interface"

export type { CreateMermaPayload, UpdateMermaPayload }

export async function getMermasRequest(): Promise<MermaDto[]> {
  return apiClient.get<MermaDto[]>("/api/mermas")
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