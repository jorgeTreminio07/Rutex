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
import { computeBestRoute } from "@/features/routes/lib/route-path"
import type { RoutePoint } from "@/features/routes/lib/route-path"
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

  const rawStart = (body.start ?? null) as { lat?: unknown; lng?: unknown } | null
  const start =
    rawStart &&
    typeof rawStart.lat === "number" &&
    Number.isFinite(rawStart.lat) &&
    typeof rawStart.lng === "number" &&
    Number.isFinite(rawStart.lng)
      ? { lat: rawStart.lat, lng: rawStart.lng }
      : null
  if (!start) {
    return badRequest(
      "Se requiere tu ubicación actual para calcular la mejor ruta. Enciende la localización.",
    )
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

  // Calcular el orden de visita (la mejor ruta) UNA sola vez, al crear:
  // partiendo de mi ubicación, del cliente más cercano al más lejano.
  // Los clientes sin coordenadas se agregan al final en el orden dado.
  const { data: clientRows, error: coordsError } = await supabase
    .from("clients")
    .select("id, latitude, longitude")
    .in("id", clientIds)

  if (coordsError) {
    if (coordsError.code === "42501") return forbidden()
    return serverError(coordsError)
  }

  const coordById = new Map((clientRows ?? []).map((row) => [row.id, row]))
  const points: RoutePoint[] = clientIds
    .filter((id) => {
      const row = coordById.get(id)
      return (
        row && typeof row.latitude === "number" && typeof row.longitude === "number"
      )
    })
    .map((id) => ({
      id,
      lat: (coordById.get(id) as { latitude: number }).latitude,
      lng: (coordById.get(id) as { longitude: number }).longitude,
    }))

  const orderedIds = computeBestRoute(start, points)
  const orderedSet = new Set(orderedIds)
  const withoutCoords = clientIds.filter((id) => !orderedSet.has(id))
  const finalOrder = [...orderedIds, ...withoutCoords]

  const { error: clientsError } = await supabase.from("route_clients").insert(
    finalOrder.map((clientId, index) => ({
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