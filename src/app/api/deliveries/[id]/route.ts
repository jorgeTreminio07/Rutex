import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
} from "@/lib/api-response"
import { requireAdmin } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import { DELIVERY_SELECT, mapDelivery } from "@/app/api/deliveries/helpers"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const statusId = Number(body.statusId)
  if (!Number.isInteger(statusId)) return badRequest("Estado inválido")

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("deliveries")
    .select("id, status_id")
    .eq("id", id)
    .maybeSingle()

  if (!existing) return notFound("Entrega no encontrada")

  // Solo se permite avanzar al siguiente estado, nunca revertir ni saltar.
  if (statusId !== existing.status_id + 1) {
    return badRequest("Solo se puede avanzar al siguiente estado de la entrega")
  }

  const { data, error } = await supabase
    .from("deliveries")
    .update({
      status_id: statusId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(DELIVERY_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return ok(mapDelivery(data))
}