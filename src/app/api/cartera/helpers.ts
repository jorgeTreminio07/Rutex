import { buildAbonoPlan, computePagoEstadoId, round2 } from "@/features/cartera/lib/pagos"
import { createClient } from "@/lib/supabase/server"

type Db = Awaited<ReturnType<typeof createClient>>

// Recalcula y persiste el estado de pago del pedido según sus abonos:
// todos pagados => Pagado (2) | alguno vencido sin pagar => En mora (3)
// en otro caso => Pendiente (1).
export async function recomputePagoEstado(supabase: Db, orderId: string) {
  const { data: abonos } = await supabase
    .from("abonos")
    .select("pagado, fecha_a_abonar")
    .eq("order_id", orderId)

  const estadoPagoId = computePagoEstadoId(
    (abonos ?? []) as Array<{ pagado: boolean; fecha_a_abonar: string }>,
  )

  await supabase
    .from("pagos")
    .update({ estado_pago_id: estadoPagoId, updated_at: new Date().toISOString() })
    .eq("order_id", orderId)
}

// Regenera el plan de abonos de un pedido aprobado tras editarlo (si cambió
// el total o la modalidad de pago). Preserva el dinero ya cobrado re-aplicando
// el monto abonado al nuevo plan en orden; el histórico (abono_registros) no se
// toca. Rechaza si lo cobrado supera el nuevo total.
export async function rebuildOrderAbonos(
  supabase: Db,
  orderId: string,
  paymentType: string,
  total: number,
  fromDate: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data: abonos } = await supabase
    .from("abonos")
    .select("abonado")
    .eq("order_id", orderId)

  const totalAbonado = round2((abonos ?? []).reduce((sum, a) => sum + Number(a.abonado), 0))

  if (totalAbonado > total) {
    return {
      ok: false,
      message: `El pedido ya tiene C$ ${totalAbonado.toFixed(2)} abonados y el nuevo total (C$ ${total.toFixed(2)}) no puede ser menor a lo cobrado.`,
    }
  }

  // Asegurar la fila de pago (por si un pedido legacy no la tiene).
  const { data: existingPago } = await supabase
    .from("pagos")
    .select("order_id")
    .eq("order_id", orderId)
    .maybeSingle()
  if (!existingPago) {
    await supabase.from("pagos").insert({ order_id: orderId, estado_pago_id: 1 })
  }

  // Eliminar el plan vigente y regenerarlo con la modalidad y el total nuevos.
  await supabase.from("abonos").delete().eq("order_id", orderId)

  const plan = buildAbonoPlan(paymentType, total, fromDate)
  if (plan.length > 0) {
    await supabase.from("abonos").insert(
      plan.map((abono) => ({
        order_id: orderId,
        fecha_a_abonar: abono.fecha,
        monto_a_abonar: abono.monto,
        abonado: 0,
        pagado: false,
      })),
    )
  }

  // Re-aplicar lo ya cobrado al nuevo plan en orden de fecha (misma lógica
  // que "Registrar abono" aplica los montos a los abonos pendientes).
  if (totalAbonado > 0) {
    const { data: newAbonos } = await supabase
      .from("abonos")
      .select("id, monto_a_abonar, abonado, pagado")
      .eq("order_id", orderId)
      .order("fecha_a_abonar", { ascending: true })
      .order("created_at", { ascending: true })

    let restante = totalAbonado
    for (const abono of newAbonos ?? []) {
      if (restante <= 0) break
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
  }

  await recomputePagoEstado(supabase, orderId)
  return { ok: true }
}