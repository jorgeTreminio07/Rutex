import { apiClient } from "@/lib/api-client"
import type { AuthUser } from "@/types/interfaces/auth.interface"

export interface LoginPayload {
  email: string
  password: string
}

export async function loginRequest(payload: LoginPayload): Promise<AuthUser> {
  return apiClient.post<AuthUser>("/api/auth/login", payload)
}

export async function logoutRequest(): Promise<void> {
  return apiClient.post("/api/auth/logout")
}

export async function sessionRequest(): Promise<AuthUser | null> {
  return apiClient.get<AuthUser | null>("/api/auth/session")
}