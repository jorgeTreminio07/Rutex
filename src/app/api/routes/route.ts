import {
  badRequest,
  created,
  forbidden,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api-response"
import { getSession } from "@/lib/server/auth"
import { requireAdmin } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import {
  mapRouteList,
  ROUTE_LIST_SELECT,
} from "@/app/api/routes/helpers"
import type { RouteType } from "@/types/interfaces/route.interface"

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("routes")
    .select(ROUTE_LIST_SELECT)
    .order("created_at", { ascending: false })

  if (error) return serverError(error)

  return ok((data ?? []).map(mapRouteList))
}

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const type = body.type as RouteType
  const rawClientIds = Array.isArray(body.clientIds) ? body.clientIds : []

  if (type !== "visita" && type !== "entregas") {
    return badRequest("El tipo de ruta debe ser visita o entregas")
  }
  const clientIds = [...new Set(rawClientIds.filter((id) => typeof id === "string"))] as string[]
  if (clientIds.length === 0) {
    return badRequest("La ruta debe tener al menos un cliente")
  }

  const supabase = await createClient()

  const { data: nextNumber, error: seqError } = await supabase.rpc("next_route_number")
  if (seqError || typeof nextNumber !== "string") {
    if (seqError?.code === "42501") return forbidden()
    return serverError(seqError ?? new Error("No se pudo generar el número de ruta"))
  }
  const routeCode = nextNumber

  const { data: route, error: routeError } = await supabase
    .from("routes")
    .insert({
      route_code: routeCode,
      type,
      status: "en_proceso",
    })
    .select("id, route_code, type, status, created_at, updated_at")
    .single()

  if (routeError) {
    if (routeError.code === "42501") return forbidden()
    return serverError(routeError)
  }

  const { error: clientsError } = await supabase.from("route_clients").insert(
    clientIds.map((clientId, index) => ({
      route_id: route.id,
      client_id: clientId,
      visit_order: index + 1,
    })),
  )

  if (clientsError) {
    if (clientsError.code === "42501") return forbidden()
    return serverError(clientsError)
  }

  return created({
    id: route.id,
    routeCode: route.route_code,
    type: route.type,
    status: route.status,
    clientCount: clientIds.length,
    createdAt: route.created_at,
    updatedAt: route.updated_at,
    clients: [],
  })
}