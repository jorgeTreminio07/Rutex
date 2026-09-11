import { apiClient } from "@/lib/api-client"
import type {
  CreateRoutePayload,
  RouteDto,
  UpdateRouteClientPayload,
} from "@/types/interfaces/route.interface"

export async function getRoutesRequest(): Promise<RouteDto[]> {
  return apiClient.get<RouteDto[]>("/api/routes")
}

export async function createRouteRequest(payload: CreateRoutePayload): Promise<RouteDto> {
  return apiClient.post<RouteDto>("/api/routes", payload)
}

export async function getRouteByCodeRequest(code: string): Promise<RouteDto> {
  return apiClient.get<RouteDto>(`/api/routes/${code}`)
}

export async function updateRouteClientRequest(
  code: string,
  clientId: string,
  payload: UpdateRouteClientPayload,
): Promise<{ client: RouteDto["clients"][number]; routeStatus: RouteDto["status"] }> {
  return apiClient.put<{ client: RouteDto["clients"][number]; routeStatus: RouteDto["status"] }>(
    `/api/routes/${code}/clients/${clientId}`,
    payload,
  )
}

export async function cancelRouteRequest(code: string): Promise<{ status: string }> {
  return apiClient.patch<{ status: string }>(`/api/routes/${code}`, { status: "cancelada" })
}

export async function deleteRouteRequest(code: string): Promise<{ deleted: boolean }> {
  return apiClient.delete<{ deleted: boolean }>(`/api/routes/${code}`)
}