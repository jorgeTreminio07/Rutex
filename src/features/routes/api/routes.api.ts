import { apiClient } from "@/lib/api-client"
import { appendListParams, type ListQueryParams } from "@/lib/query-params"
import type {
  CreateRoutePayload,
  RouteDto,
  UpdateRouteClientPayload,
} from "@/types/interfaces/route.interface"
import type { RouteStatusFilter } from "@/types/interfaces/route.interface"
import type { PaginatedResult } from "@/types/interfaces/pagination.interface"

export type GetRoutesParams = ListQueryParams & { status?: RouteStatusFilter }

function buildQueryString(params: GetRoutesParams): string {
  const url = new URL("/api/routes", window.location.origin)
  appendListParams(url, params)
  if (params.status && params.status !== "todos") {
    url.searchParams.set("status", params.status)
  }
  return url.pathname + url.search
}

export async function getRoutesRequest(params: GetRoutesParams): Promise<PaginatedResult<RouteDto>> {
  return apiClient.get<PaginatedResult<RouteDto>>(buildQueryString(params))
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