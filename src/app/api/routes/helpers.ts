import type {
  RouteClientDto,
  RouteDto,
  RouteStatus,
  RouteType,
} from "@/types/interfaces/route.interface"

export const ROUTE_LIST_SELECT =
  "id, route_code, type, status, created_at, updated_at, route_clients(count)"

export const ROUTE_DETAIL_SELECT =
  "id, route_code, type, status, created_at, updated_at, route_clients(id, client_id, visit_order, status, observation, created_at, clients(id, full_name, phone, cedula, address, city, latitude, longitude))"

interface ClientInfoRow {
  id: string
  full_name: string
  phone: string | null
  cedula: string | null
  address: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
}

export interface RouteClientRow {
  id: string
  client_id: string
  visit_order: number
  status: RouteClientDto["status"]
  observation: string | null
  created_at: string
  clients: ClientInfoRow | ClientInfoRow[] | null
}

export interface RouteListRow {
  id: string
  route_code: string
  type: RouteType
  status: RouteStatus
  created_at: string
  updated_at: string | null
  route_clients: { count: number }[]
}

export interface RouteDetailRow {
  id: string
  route_code: string
  type: RouteType
  status: RouteStatus
  created_at: string
  updated_at: string | null
  route_clients: RouteClientRow[]
}

function single<T>(value: T | T[]): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value
}

export function mapRouteClient(row: RouteClientRow): RouteClientDto {
  const client = single(row.clients)
  return {
    id: row.id,
    clientId: row.client_id,
    fullName: client?.full_name ?? "Cliente eliminado",
    phone: client?.phone ?? null,
    cedula: client?.cedula ?? null,
    city: client?.city ?? null,
    address: client?.address ?? null,
    latitude: client?.latitude ?? null,
    longitude: client?.longitude ?? null,
    visitOrder: row.visit_order,
    status: row.status,
    observation: row.observation,
    createdAt: row.created_at,
  }
}

export function mapRouteList(row: RouteListRow): RouteDto {
  const count = row.route_clients?.[0]?.count ?? 0
  return {
    id: row.id,
    routeCode: row.route_code,
    type: row.type,
    status: row.status,
    clientCount: count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clients: [],
  }
}

export function mapRouteDetail(row: RouteDetailRow): RouteDto {
  const clients = Array.isArray(row.route_clients) ? row.route_clients : []
  return {
    id: row.id,
    routeCode: row.route_code,
    type: row.type,
    status: row.status,
    clientCount: clients.length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clients: clients
      .sort((a, b) => Number(a.visit_order) - Number(b.visit_order))
      .map(mapRouteClient),
  }
}