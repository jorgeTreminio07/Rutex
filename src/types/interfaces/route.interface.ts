export type RouteType = "visita" | "entregas"
export type RouteStatus = "en_proceso" | "completada" | "cancelada"
export type RouteClientStatus = "pendiente" | "completada" | "cancelada"

export interface RouteClientDto {
  id: string
  clientId: string
  fullName: string
  phone: string | null
  cedula: string | null
  city: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  visitOrder: number
  status: RouteClientStatus
  observation: string | null
  createdAt: string
}

export interface RouteDto {
  id: string
  routeCode: string
  type: RouteType
  status: RouteStatus
  clientCount: number
  createdAt: string
  updatedAt: string | null
  clients: RouteClientDto[]
}

export type RouteStatusFilter = "todos" | RouteStatus

export const ROUTE_STATUS_OPTIONS: { value: RouteStatusFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "en_proceso", label: "En proceso" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
]

export const ROUTE_TYPE_OPTIONS: { value: RouteType; label: string }[] = [
  { value: "visita", label: "Visita" },
  { value: "entregas", label: "Entregas" },
]

export function matchesRouteStatus(status: RouteStatus, filter: RouteStatusFilter): boolean {
  if (filter === "todos") return true
  return status === filter
}

export function labelForRouteStatus(status: RouteStatus): string {
  switch (status) {
    case "en_proceso":
      return "En proceso"
    case "completada":
      return "Completada"
    case "cancelada":
      return "Cancelada"
  }
}

export function labelForRouteType(type: RouteType): string {
  return type === "visita" ? "Visita" : "Entregas"
}

export interface CreateRoutePayload {
  type: RouteType
  clientIds: string[]
  start: { lat: number; lng: number } | null
}

export interface UpdateRouteClientPayload {
  status: Exclude<RouteClientStatus, "pendiente">
  observation?: string | null
}