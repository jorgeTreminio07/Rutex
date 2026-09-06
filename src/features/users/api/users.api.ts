import { apiClient } from "@/lib/api-client"
import type { UserDto } from "@/types/interfaces/user.interface"

export interface CreateUserPayload {
  username: string
  firstName?: string
  lastName?: string
  email?: string
  password: string
  roleId: string
  statusId?: number
  photo?: File | null
  signature?: File | null
}

export interface UpdateUserPayload {
  username?: string
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  roleId?: string
  statusId?: number
  photo?: File | null
  signature?: File | null
  removeSignature?: boolean
}

function buildFormData(
  payload: Record<string, unknown>,
  photo?: File | null,
  signature?: File | null,
  removeSignature?: boolean,
): FormData {
  const formData = new FormData()

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, String(value))
    }
  }

  if (photo) {
    formData.append("photo", photo, photo.name)
  }

  if (signature) {
    formData.append("signature", signature, signature.name)
  }

  if (removeSignature) {
    formData.append("removeSignature", "true")
  }

  return formData
}

export async function getUsersRequest(): Promise<UserDto[]> {
  return apiClient.get<UserDto[]>("/api/users")
}

export async function createUserRequest(payload: CreateUserPayload): Promise<UserDto> {
  const { username, photo, signature, ...rest } = payload
  const formData = buildFormData({ ...rest, username }, photo, signature)
  return apiClient.post<UserDto>("/api/users", formData)
}

export async function updateUserRequest(id: string, payload: UpdateUserPayload): Promise<UserDto> {
  const { photo, signature, removeSignature, ...rest } = payload
  const formData = buildFormData(rest, photo, signature, removeSignature)
  return apiClient.put<UserDto>(`/api/users/${id}`, formData)
}

export async function deleteUserRequest(id: string): Promise<void> {
  return apiClient.delete(`/api/users/${id}`)
}

export function buildInitials(username?: string | null): string {
  return username?.trim().slice(0, 2).toUpperCase() ?? "??"
}