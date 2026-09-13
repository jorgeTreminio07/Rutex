import { ok, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import { fetchAllRows } from "@/app/api/pagination"
import {
  nicaraguaDayRange,
  nicaDate,
  nicaToday,
  parseOrderItems,
  round2,
  toNumber,
} from "@/app/api/reports/helpers"
import type {
  DashboardCashflowRow,
  DashboardDto,
  DashboardEntregasRow,
  DashboardHorarioRow,
  DashboardMermaMotivoRow,
  DashboardStockBajoRow,
  DashboardTopProductoRow,
} from "@/types/interfaces/report.interface"

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

function monthKey(iso: string | null): string {
  if (!iso) return ""
  return new Date(new Date(iso).getTime() - 6 * 60 * 60 * 1000).toISOString().slice(0, 7)
}

const STOCK_BAJO_LIMIT = 5
const VENTAS_DAYS = 30
const CASHFLOW_MONTHS = 6

/**
 * Panel de inicio (dashboard): devuelve en una sola petición los KPIs y las
 * series para los gráficos (ventas por día, productos top, cartera, flujo de
 * caja, horario, entregas, stock bajo y mermas por motivo). Todo en hora
 * Nicaragua (UTC-6) y solo considera pedidos APROBADOS (status 6, no borrados).
 */
export async function GET() {
  const guard = await requirePermission("dashboard:ver")
  if (!guard.ok) return guard.response!

  const supabase = await createClient()
  const today = nicaToday()

  const windowStart = nicaraguaDayRange(addDays(today, -(VENTAS_DAYS - 1))).start
  const nowIso = new Date().toISOString()
  const cashflowStart = new Date(
    Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - CASHFLOW_MONTHS, 1),
  ).toISOString()

  const [
    approvedOrdersRes,
    cashflowOrdersRes,
    inProcessRes,
    comprasRes,
    gastosRes,
    deliveriesRes,
    stockListRes,
    stockCountRes,
    mermasRes,
    pagosRes,
    abonosRes,
  ] = await Promise.all([
    fetchAllRows<{
      id: string
      order_number: string | null
      items: unknown
      total: number | string | null
      created_at: string
    }>((from, to) =>
      supabase
        .from("orders")
        .select("id, order_number, items, total, created_at")
        .eq("status_id", 6)
        .is("deleted_at", null)
        .gte("created_at", windowStart)
        .lt("created_at", nowIso)
        .range(from, to),
    ),
    fetchAllRows<{ total: number | string | null; created_at: string | null }>((from, to) =>
      supabase
        .from("orders")
        .select("total, created_at")
        .eq("status_id", 6)
        .is("deleted_at", null)
        .gte("created_at", cashflowStart)
        .range(from, to),
    ),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status_id", 5)
      .is("deleted_at", null),
    fetchAllRows<{ amount: number | string | null; created_at: string | null }>((from, to) =>
      supabase
        .from("compras")
        .select("amount, created_at")
        .gte("created_at", cashflowStart)
        .not("amount", "is", null)
        .range(from, to),
    ),
    fetchAllRows<{ amount: number | string | null; created_at: string | null }>((from, to) =>
      supabase
        .from("gastos")
        .select("amount, created_at")
        .gte("created_at", cashflowStart)
        .not("amount", "is", null)
        .range(from, to),
    ),
    fetchAllRows<{ status_id: number | string | null; delivery_statuses: unknown }>((from, to) =>
      supabase
        .from("deliveries")
        .select("status_id, delivery_statuses(name)")
        .range(from, to),
    ),
    supabase
      .from("products")
      .select("name, stock")
      .eq("status_id", 1)
      .is("deleted_at", null)
      .order("stock", { ascending: true })
      .limit(10),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status_id", 1)
      .is("deleted_at", null)
      .lte("stock", STOCK_BAJO_LIMIT),
    fetchAllRows<{ total_value: number | string | null; motivo_id: number; merma_motivos: unknown }>(
      (from, to) => supabase.from("mermas").select("total_value, motivo_id, merma_motivos(name)").range(from, to),
    ),
    fetchAllRows<{ order_id: string }>((from, to) => supabase.from("pagos").select("order_id").range(from, to)),
    fetchAllRows<{
      order_id: string
      monto_a_abonar: number | string | null
      abonado: number | string | null
      pagado: boolean | null
      fecha_a_abonar: string | null
    }>((from, to) =>
      supabase
        .from("abonos")
        .select("order_id, monto_a_abonar, abonado, pagado, fecha_a_abonar")
        .range(from, to),
    ),
  ])

  const responses = [
    approvedOrdersRes,
    cashflowOrdersRes,
    comprasRes,
    gastosRes,
    deliveriesRes,
    mermasRes,
    pagosRes,
    abonosRes,
  ] as const
  for (const res of responses) {
    if (res.error) return serverError(res.error)
  }
  if (inProcessRes.error) return serverError(inProcessRes.error)
  if (stockListRes.error) return serverError(stockListRes.error)
  if (stockCountRes.error) return serverError(stockCountRes.error)

  const approvedOrders = approvedOrdersRes.data ?? []

  const byDay = new Map<string, { ventas: number; ganancia: number; pedidos: number }>()
  const fechaInicio = addDays(today, -(VENTAS_DAYS - 1))
  for (let i = 0; i < VENTAS_DAYS; i++) {
    byDay.set(addDays(fechaInicio, i), { ventas: 0, ganancia: 0, pedidos: 0 })
  }
  const topMap = new Map<string, { unidades: number; ventas: number }>()
  const byHour = new Map<number, number>()

  for (const order of approvedOrders) {
    const fecha = nicaDate(order.created_at)
    const total = toNumber(order.total)

    let ganancia = 0
    for (const item of parseOrderItems(order.items)) {
      const cantidad = toNumber(item?.quantity)
      if (cantidad <= 0) continue
      ganancia += (toNumber(item?.price) - toNumber(item?.purchasePrice)) * cantidad

      const name = String(item?.productName ?? "Producto")
      const agg = topMap.get(name) ?? { unidades: 0, ventas: 0 }
      agg.unidades += cantidad
      agg.ventas += toNumber(item?.price) * cantidad
      topMap.set(name, agg)
    }

    const day = byDay.get(fecha)
    if (day) {
      day.ventas += total
      day.ganancia += ganancia
      day.pedidos += 1
    }

    const hour = (new Date(order.created_at).getUTCHours() - 6 + 24) % 24
    byHour.set(hour, (byHour.get(hour) ?? 0) + 1)
  }

  const ventasPorDia = [...byDay.entries()].map(([fecha, agg]) => ({
    fecha,
    ventas: round2(agg.ventas),
    ganancia: round2(agg.ganancia),
    pedidos: agg.pedidos,
  }))

  const topProductos: DashboardTopProductoRow[] = [...topMap.entries()]
    .map(([producto, agg]) => ({
      producto,
      unidades: round2(agg.unidades),
      ventas: round2(agg.ventas),
    }))
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, 10)

  const horario: DashboardHorarioRow[] = [...byHour.entries()]
    .map(([hora, pedidos]) => ({ hora, pedidos }))
    .sort((a, b) => a.hora - b.hora)

  // Cartera: solo abonos de pedidos que tienen pagos y NO están borrados.
  const carteraOrderIds = [...new Set((pagosRes.data ?? []).map((p) => p.order_id as string))]
  let carteraCobrado = 0
  let carteraPendiente = 0
  let cuotasVencidas = 0
  if (carteraOrderIds.length > 0) {
    const activeCarteraResult = await fetchAllRows<{ id: string }>((from, to) =>
      supabase
        .from("orders")
        .select("id")
        .in("id", carteraOrderIds)
        .is("deleted_at", null)
        .range(from, to),
    )
    if (!activeCarteraResult.data) return serverError(activeCarteraResult.error)

    const activeCarteraSet = new Set(activeCarteraResult.data.map((o) => o.id))
    for (const abono of abonosRes.data ?? []) {
      if (!activeCarteraSet.has(abono.order_id)) continue
      const monto = toNumber(abono.monto_a_abonar)
      const abonado = toNumber(abono.abonado)
      carteraCobrado += abonado
      carteraPendiente += Math.max(0, monto - abonado)
      if (!Boolean(abono.pagado) && (abono.fecha_a_abonar ?? "") < today) cuotasVencidas += 1
    }
  }

  // Flujo de caja por mes: ventas (6 meses) vs compras vs gastos.
  const cashflowMap = new Map<string, { ventas: number; compras: number; gastos: number }>()
  for (const order of cashflowOrdersRes.data ?? []) {
    const key = monthKey(order.created_at)
    const agg = cashflowMap.get(key) ?? { ventas: 0, compras: 0, gastos: 0 }
    agg.ventas += toNumber(order.total)
    cashflowMap.set(key, agg)
  }
  for (const compra of comprasRes.data ?? []) {
    const key = monthKey(compra.created_at)
    const agg = cashflowMap.get(key) ?? { ventas: 0, compras: 0, gastos: 0 }
    agg.compras += toNumber(compra.amount)
    cashflowMap.set(key, agg)
  }
  for (const gasto of gastosRes.data ?? []) {
    const key = monthKey(gasto.created_at)
    const agg = cashflowMap.get(key) ?? { ventas: 0, compras: 0, gastos: 0 }
    agg.gastos += toNumber(gasto.amount)
    cashflowMap.set(key, agg)
  }

  const cashflow: DashboardCashflowRow[] = []
  const [curY, curM] = today.split("-").map(Number)
  for (let i = CASHFLOW_MONTHS - 1; i >= 0; i--) {
    const key = new Date(Date.UTC(curY, curM - 1 - i, 1)).toISOString().slice(0, 7)
    const agg = cashflowMap.get(key) ?? { ventas: 0, compras: 0, gastos: 0 }
    cashflow.push({
      mes: key,
      ventas: round2(agg.ventas),
      compras: round2(agg.compras),
      gastos: round2(agg.gastos),
    })
  }

  const entregas: DashboardEntregasRow[] = (deliveriesRes.data ?? []).reduce<DashboardEntregasRow[]>(
    (acc, delivery) => {
      const statusId = toNumber(delivery.status_id)
      const existing = acc.find((row) => row.statusId === statusId)
      if (existing) existing.count += 1
      else {
        const status = (delivery.delivery_statuses as unknown as { name?: string } | null)?.name
        acc.push({ statusId, status: status ?? String(statusId), count: 1 })
      }
      return acc
    },
    [],
  )

  const stockBajo: DashboardStockBajoRow[] = (stockListRes.data ?? []).map((p) => ({
    producto: String(p.name ?? "Producto"),
    stock: toNumber(p.stock),
  }))

  const mermasPorMotivo: DashboardMermaMotivoRow[] = (mermasRes.data ?? [])
    .reduce<DashboardMermaMotivoRow[]>((acc, merma) => {
      const motive =
        (merma.merma_motivos as unknown as { name?: string } | null)?.name ?? "Sin motivo"
      const existing = acc.find((row) => row.motivo === motive)
      if (existing) existing.total += toNumber(merma.total_value)
      else acc.push({ motivo: motive, total: toNumber(merma.total_value) })
      return acc
    }, [])
    .map((row) => ({ ...row, total: round2(row.total) }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  const hoy = ventasPorDia.find((row) => row.fecha === today)
  const dto: DashboardDto = {
    generatedAt: nowIso,
    kpis: {
      ventasHoy: hoy?.ventas ?? 0,
      gananciaHoy: hoy?.ganancia ?? 0,
      pedidosHoy: hoy?.pedidos ?? 0,
      pedidosEnProceso: inProcessRes.count ?? 0,
      carteraPendiente: round2(carteraPendiente),
      cuotasVencidas,
      stockBajos: stockCountRes.count ?? 0,
    },
    ventasPorDia,
    topProductos,
    cartera: { cobrado: round2(carteraCobrado), pendiente: round2(carteraPendiente) },
    cashflow,
    horario,
    entregas,
    stockBajo,
    mermasPorMotivo,
  }

  return ok(dto)
}