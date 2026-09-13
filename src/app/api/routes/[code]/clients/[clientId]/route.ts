import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
} from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { mapRouteClient } from "@/app/api/routes/helpers"
import type { RouteClientStatus, RouteStatus } from "@/types/interfaces/route.interface"

const ROUTE_CLIENT_SELECT =
  "id, client_id, visit_order, status, observation, created_at, clients(id, full_name, phone, cedula, address, city, latitude, longitude)"

interface RouteContext {
  params: Promise<{ code: string; clientId: string }>
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { code, clientId } = await params
  const guard = await requirePermission("rutas:actualizar")
  if (!guard.ok) return guard.response!

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const status = body.status as RouteClientStatus
  if (status !== "completada" && status !== "cancelada") {
    return badRequest("El estado debe ser completada o cancelada")
  }

  const observation = typeof body.observation === "string" ? body.observation.trim() : null

  const supabase = createAdminClient()

  const { data: route } = await supabase
    .from("routes")
    .select("id")
    .eq("route_code", code)
    .maybeSingle()

  if (!route) return notFound("Ruta no encontrada")

  const { data: existing } = await supabase
    .from("route_clients")
    .select("id")
    .eq("route_id", route.id)
    .eq("client_id", clientId)
    .maybeSingle()

  if (!existing) return notFound("Cliente no encontrado en la ruta")

  const { data: updated, error: updateError } = await supabase
    .from("route_clients")
    .update({ status, observation: observation || null })
    .eq("id", existing.id)
    .select(ROUTE_CLIENT_SELECT)
    .single()

  if (updateError) {
    if (updateError.code === "42501") return forbidden()
    return serverError(updateError)
  }

  // Recalcular el estado de la ruta según el avance de sus visitas:
  // cuando todos los clientes quedaron con un estado final (completada o
  // cancelada), la ruta pasa a completada; si aún hay pendientes, queda en proceso.
  const { data: statuses } = await supabase
    .from("route_clients")
    .select("status")
    .eq("route_id", route.id)

  const allStatuses = (statuses ?? []).map((r) => r.status as RouteClientStatus)
  const routeStatus: RouteStatus =
    allStatuses.length > 0 && allStatuses.every((s) => s !== "pendiente")
      ? "completada"
      : "en_proceso"

  const { error: routeUpdateError } = await supabase
    .from("routes")
    .update({ status: routeStatus, updated_at: new Date().toISOString() })
    .eq("id", route.id)

  if (routeUpdateError && routeUpdateError.code === "42501") return forbidden()

  return ok({
    client: mapRouteClient(updated as never),
    routeStatus,
  })
}