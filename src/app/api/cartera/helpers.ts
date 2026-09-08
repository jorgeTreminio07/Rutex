import { computePagoEstadoId } from "@/features/cartera/lib/pagos"
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