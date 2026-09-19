import { badRequest, notFound, ok, serverError } from "@/lib/api-response"
import { recomputePagoEstado } from "@/app/api/cartera/helpers"
import { round2 } from "@/features/cartera/lib/pagos"
import { fmtMoney } from "@/lib/format"
import { requirePermission } from "@/lib/server/guards"
import { createAdminClient } from "@/lib/supabase/admin"

interface RouteContext {
  params: Promise<{ orderId: string }>
}

interface AbonoRow {
  id: string
  monto_a_abonar: number
  abonado: number
  pagado: boolean
  fecha_pago: string | null
}

export async function POST(request: Request, { params }: RouteContext) {
  const { orderId } = await params
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

  const { data: pago } = await supabase
    .from("pagos")
    .select("order_id")
    .eq("order_id", orderId)
    .maybeSingle()

  if (!pago) return notFound("El pedido no está en cartera")

  const { data: order } = await supabase
    .from("orders")
    .select("total")
    .eq("id", orderId)
    .is("deleted_at", null)
    .single()

  if (!order) return notFound("Pedido no encontrado")

  const { data: abonos, error: abonosError } = await supabase
    .from("abonos")
    .select("id, monto_a_abonar, abonado, pagado, fecha_pago")
    .eq("order_id", orderId)
    .order("fecha_a_abonar", { ascending: true })
    .order("created_at", { ascending: true })

  if (abonosError) return serverError(abonosError)

  const totalAbonado = (abonos ?? []).reduce((sum, a) => sum + Number(a.abonado), 0)
  const saldo = Math.max(0, Number(order.total) - totalAbonado)

  if (saldo <= 0) {
    return badRequest("El pedido ya está saldado, no se pueden registrar más abonos")
  }

  if (monto > saldo) {
    return badRequest(`El abono (${fmtMoney(monto)}) sobrepasa el saldo restante (${fmtMoney(saldo)})`)
  }

  // Aplicar el abono a los abonos pendientes en orden de fecha.
  let restante = monto
  for (const abono of (abonos ?? []) as AbonoRow[]) {
    if (restante <= 0) break
    if (abono.pagado) continue
    const falta = Number(abono.monto_a_abonar) - Number(abono.abonado)
    if (falta <= 0) continue
    const abonoTotal = Math.min(falta, restante)
    const nuevoAbonado = Number(abono.abonado) + abonoTotal
    const quedaPagado = nuevoAbonado >= Number(abono.monto_a_abonar)
    restante = round2(restante - abonoTotal)

    await supabase
      .from("abonos")
      .update({
        abonado: nuevoAbonado,
        pagado: quedaPagado,
        fecha_pago: quedaPagado ? new Date().toISOString() : null,
      })
      .eq("id", abono.id)
  }

  await recomputePagoEstado(supabase, orderId)

  await supabase.from("abono_registros").insert({
    order_id: orderId,
    monto,
    fecha: new Date().toISOString(),
  })

  return ok({
    monto,
    saldoAnterior: saldo,
    saldoNuevo: Math.max(0, saldo - monto),
  })
}