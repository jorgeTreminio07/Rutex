import { badRequest, forbidden, ok, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createAdminClient } from "@/lib/supabase/admin"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params
  const guard = await requirePermission("pedidos:notificar")
  if (!guard.ok) return guard.response!

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const url = (body.url as string)?.trim()
  if (!url) return badRequest("La URL de la proforma es obligatoria")

  const supabase = createAdminClient()

  const { error } = await supabase
    .from("orders")
    .update({ proforma_url: url })
    .eq("id", id)

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return ok({ url })
}