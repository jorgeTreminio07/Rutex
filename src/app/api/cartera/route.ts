import { ok, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import { nicaraguaDayRange } from "@/app/api/reports/helpers"
import { paginated, parsePagination } from "@/app/api/pagination"

interface OrderRow {
  id: string
  order_number: string | null
  customer_name: string
  customer_phone: string | null
  total: number
  payment_type: string
  created_at: string
  pagos: { estado_pago_id: number }[] | null
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

const STATUS_MAP: Record<string, number> = {
  pendiente: 1,
  pagado: 2,
  en_mora: 3,
}

export async function GET(request: Request) {
  const guard = await requirePermission("cartera:ver")
  if (!guard.ok) return guard.response!

  const url = new URL(request.url)
  const search = url.searchParams.get("search")?.trim() || undefined
  const dateFilter = url.searchParams.get("date")
  const statusId = url.searchParams.get("status") ? STATUS_MAP[url.searchParams.get("status")!] : undefined
  const paging = parsePagination(url)

  const supabase = await createClient()

  const buildBase = () => {
    let query = supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, customer_phone, total, payment_type, created_at, pagos!inner(estado_pago_id)",
        { count: "exact" },
      )
      .is("deleted_at", null)
    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,order_number.ilike.%${search}%,customer_phone.ilike.%${search}%`,
      )
    }
    if (statusId) query = query.eq("pagos.estado_pago_id", statusId)
    if (dateFilter) {
      const { start, end } = nicaraguaDayRange(dateFilter)
      query = query.gte("created_at", start).lt("created_at", end)
    }
    return query.order("created_at", { ascending: false })
  }

  const { data: rows, count, error } = await buildBase().range(paging.from, paging.to)
  if (error) return serverError(error)

  const pageOrders = (rows ?? []) as OrderRow[]
  const orderIds = pageOrders.map((o) => o.id)

  const abonosByOrder = new Map<string, AbonoRow[]>()
  const registrosByOrder = new Map<string, RegistroRow[]>()

  let estadoById = new Map<number, string>()
  if (orderIds.length > 0) {
    const [estadosRes, abonosRes, registrosRes] = await Promise.all([
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

    if (estadosRes.error) return serverError(estadosRes.error)
    if (abonosRes.error) return serverError(abonosRes.error)
    if (registrosRes.error) return serverError(registrosRes.error)

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

  const mapped = pageOrders.map((o) => {
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
    const estadoPagoId = (o.pagos?.[0]?.estado_pago_id as number | undefined) ?? 1
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
  })

  return ok(paginated(mapped, count ?? 0, paging.page, paging.pageSize))
}