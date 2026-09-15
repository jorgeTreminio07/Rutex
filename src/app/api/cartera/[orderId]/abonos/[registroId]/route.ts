import { applyAbonoRegistros } from "@/app/api/cartera/helpers"
import { round2 } from "@/features/cartera/lib/pagos"
import { badRequest, notFound, ok } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createAdminClient } from "@/lib/supabase/admin"

interface RouteContext {
  params: Promise<{ orderId: string; registroId: string }>
}

interface RegistroRow {
  id: string
  monto: number
}

async function loadRegistros(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: string,
): Promise<RegistroRow[]> {
  const { data } = await supabase
    .from("abono_registros")
    .select("id, monto")
    .eq("order_id", orderId)
    .order("fecha", { ascending: true })
    .order("created_at", { ascending: true })
  return (data ?? []) as RegistroRow[]
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { orderId, registroId } = await params
  const guard = await requirePermission("cartera:abonar")
  if (!guard.ok) return guard.response!

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const monto = round2(Number(body.monto))
  if (!Number.isFinite(monto) || monto <= 0) return badRequest("El monto del abono es obligatorio")

  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from("orders")
    .select("total")
    .eq("id", orderId)
    .is("deleted_at", null)
    .single()
  if (!order) return notFound("Pedido no encontrado")

  const { data: registro } = await supabase
    .from("abono_registros")
    .select("id")
    .eq("id", registroId)
    .eq("order_id", orderId)
    .maybeSingle()
  if (!registro) return notFound("Abono no encontrado")

  const registros = (await loadRegistros(supabase, orderId)).map((r) =>
    r.id === registroId ? { ...r, monto } : r,
  )

  const result = await applyAbonoRegistros(supabase, orderId, Number(order.total), registros)
  if (!result.ok) return badRequest(result.message)

  const { error } = await supabase.from("abono_registros").update({ monto }).eq("id", registroId)
  if (error) return badRequest(error.message)

  return ok({ monto, totalAbonado: result.totalAbonado })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { orderId, registroId } = await params
  const guard = await requirePermission("cartera:abonar")
  if (!guard.ok) return guard.response!

  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from("orders")
    .select("total")
    .eq("id", orderId)
    .is("deleted_at", null)
    .single()
  if (!order) return notFound("Pedido no encontrado")

  const { data: registro } = await supabase
    .from("abono_registros")
    .select("id, monto")
    .eq("id", registroId)
    .eq("order_id", orderId)
    .maybeSingle()
  if (!registro) return notFound("Abono no encontrado")

  const registros = (await loadRegistros(supabase, orderId)).filter((r) => r.id !== registroId)

  const result = await applyAbonoRegistros(supabase, orderId, Number(order.total), registros)
  if (!result.ok) return badRequest(result.message)

  const { error } = await supabase.from("abono_registros").delete().eq("id", registroId)
  if (error) return badRequest(error.message)

  return ok({ monto: Number(registro.monto), totalAbonado: result.totalAbonado })
}