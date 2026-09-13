import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
} from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  mapRouteDetail,
  ROUTE_DETAIL_SELECT,
} from "@/app/api/routes/helpers"
import type { RouteStatus } from "@/types/interfaces/route.interface"

interface RouteContext {
  params: Promise<{ code: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { code } = await params
  const guard = await requirePermission("rutas:ver")
  if (!guard.ok) return guard.response!

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("routes")
    .select(ROUTE_DETAIL_SELECT)
    .eq("route_code", code)
    .maybeSingle()

  if (error) return serverError(error)
  if (!data) return notFound("Ruta no encontrada")

  return ok(mapRouteDetail(data))
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { code } = await params
  const guard = await requirePermission("rutas:cancelar")
  if (!guard.ok) return guard.response!

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const status = body.status as RouteStatus
  if (status !== "cancelada") {
    return badRequest("Solo se puede cancelar la ruta")
  }

  const supabase = createAdminClient()
  const { data: route } = await supabase
    .from("routes")
    .select("id")
    .eq("route_code", code)
    .maybeSingle()

  if (!route) return notFound("Ruta no encontrada")

  const { error } = await supabase
    .from("routes")
    .update({ status: "cancelada", updated_at: new Date().toISOString() })
    .eq("id", route.id)

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return ok({ status: "cancelada" })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { code } = await params
  const guard = await requirePermission("rutas:eliminar")
  if (!guard.ok) return guard.response!

  const supabase = createAdminClient()
  const { data: route } = await supabase
    .from("routes")
    .select("id")
    .eq("route_code", code)
    .maybeSingle()

  if (!route) return notFound("Ruta no encontrada")

  const { error } = await supabase.from("routes").delete().eq("id", route.id)

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return ok({ deleted: true })
}