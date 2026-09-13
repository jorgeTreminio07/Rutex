import { apiClient } from "@/lib/api-client"
import type { RoleDto } from "@/types/interfaces/user.interface"

export interface CreateRolePayload {
  name: string
  description?: string
  statusId?: number
  permissions?: string[]
}

export interface UpdateRolePayload {
  name?: string
  description?: string
  statusId?: number
  permissions?: string[]
}

export async function getRolesRequest(): Promise<RoleDto[]> {
  return apiClient.get<RoleDto[]>("/api/roles")
}

export async function createRoleRequest(payload: CreateRolePayload): Promise<RoleDto> {
  return apiClient.post<RoleDto>("/api/roles", payload)
}

export async function updateRoleRequest(id: string, payload: UpdateRolePayload): Promise<RoleDto> {
  return apiClient.put<RoleDto>(`/api/roles/${id}`, payload)
}

export async function deleteRoleRequest(id: string): Promise<void> {
  return apiClient.delete(`/api/roles/${id}`)
}