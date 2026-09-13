import { ok, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"

interface PagoRow {
  order_id: string
  estado_pago_id: number
}

interface OrderRow {
  id: string
  order_number: string | null
  customer_name: string
  customer_phone: string | null
  total: number
  payment_type: string
  created_at: string
}

interface AbonoRow {
  id: string
  order_id: string
  fecha_a_abonar: string
  monto_a_abonar: number
  abonado: number
  pagado: boolean
  fecha_pago: string | null
  created_at: string
}

interface RegistroRow {
  id: string
  order_id: string
  monto: number
  fecha: string
}

export async function GET() {
  const guard = await requirePermission("cartera:ver")
  if (!guard.ok) return guard.response!

  const supabase = await createClient()

  const { data: pagos, error: pagosError } = await supabase
    .from("pagos")
    .select("order_id, estado_pago_id")

  if (pagosError) return serverError(pagosError)

  const orderIds = (pagos ?? []).map((p) => p.order_id)

  let orders: OrderRow[] = []
  let estadoById = new Map<number, string>()
  const abonosByOrder = new Map<string, AbonoRow[]>()
  const registrosByOrder = new Map<string, RegistroRow[]>()

  if (orderIds.length > 0) {
    const [ordersRes, estadosRes, abonosRes, registrosRes] = await Promise.all([
      supabase
        .from("orders")
        .select("id, order_number, customer_name, customer_phone, total, payment_type, created_at")
        .in("id", orderIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase.from("pago_estados").select("id, name"),
      supabase
        .from("abonos")
        .select("id, order_id, fecha_a_abonar, monto_a_abonar, abonado, pagado, fecha_pago, created_at")
        .in("order_id", orderIds)
        .order("fecha_a_abonar", { ascending: true }),
      supabase
        .from("abono_registros")
        .select("id, order_id, monto, fecha")
        .in("order_id", orderIds)
        .order("fecha", { ascending: true }),
    ])

    if (ordersRes.error) return serverError(ordersRes.error)
    if (estadosRes.error) return serverError(estadosRes.error)
    if (abonosRes.error) return serverError(abonosRes.error)
    if (registrosRes.error) return serverError(registrosRes.error)

    orders = (ordersRes.data ?? []) as OrderRow[]
    estadoById = new Map((estadosRes.data ?? []).map((e) => [e.id, e.name]))

    for (const abono of (abonosRes.data ?? []) as AbonoRow[]) {
      const list = abonosByOrder.get(abono.order_id) ?? []
      list.push(abono)
      abonosByOrder.set(abono.order_id, list)
    }

    for (const registro of (registrosRes.data ?? []) as RegistroRow[]) {
      const list = registrosByOrder.get(registro.order_id) ?? []
      list.push(registro)
      registrosByOrder.set(registro.order_id, list)
    }
  }

  const estadoByOrder = new Map((pagos ?? []).map((p: PagoRow) => [p.order_id, p.estado_pago_id]))

  return ok(
    orders.map((o) => {
      const abonos = (abonosByOrder.get(o.id) ?? []).map((a) => ({
        id: a.id,
        orderId: a.order_id,
        fechaAbonar: a.fecha_a_abonar,
        montoAbonar: Number(a.monto_a_abonar),
        abonado: Number(a.abonado),
        pagado: a.pagado,
        fechaPago: a.fecha_pago,
      }))
      const registros = (registrosByOrder.get(o.id) ?? []).map((r) => ({
        id: r.id,
        orderId: r.order_id,
        monto: Number(r.monto),
        fecha: r.fecha,
      }))
      const totalAbonado = abonos.reduce((sum, a) => sum + a.abonado, 0)
      const estadoPagoId = estadoByOrder.get(o.id) ?? 1
      return {
        id: o.id,
        orderNumber: o.order_number,
        customerName: o.customer_name,
        customerPhone: o.customer_phone,
        total: Number(o.total),
        paymentType: o.payment_type,
        createdAt: o.created_at,
        estadoPagoId,
        estadoPago: estadoById.get(estadoPagoId) ?? "Pendiente",
        abonado: totalAbonado,
        saldo: Math.max(0, Number(o.total) - totalAbonado),
        abonos,
        registros,
      }
    }),
  )
}