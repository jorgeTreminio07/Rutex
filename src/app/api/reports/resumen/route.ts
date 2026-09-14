import { ok, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import { fetchAllRows } from "@/app/api/pagination"
import {
  nicaraguaDayRange,
  nicaDate,
  parseMermaItems,
  parseOrderItems,
  parseReportRange,
  round2,
  toNumber,
} from "@/app/api/reports/helpers"
import type {
  ResumenDiaRow,
  ResumenReportDto,
  ResumenReportSummary,
} from "@/types/interfaces/report.interface"

/**
 * Resumen financiero: une en un solo cuadro las ventas (pedidos aprobados),
 * los gastos, las compras y la pérdida por mermas del período. Las compras se
 * muestran como inversión en inventario (NO se restan de la ganancia neta,
 * porque el costo de lo comprado ya queda dentro del costo de venta). También
 * expone la serie por día para el gráfico/tabla de flujo.
 */
export async function GET(request: Request) {
  const guard = await requirePermission("reportes:ver")
  if (!guard.ok) return guard.response!

  const range = parseReportRange(new URL(request.url))
  if (!range.ok) return range.response
  const { from, to } = range

  const { start } = nicaraguaDayRange(from)
  const { end } = nicaraguaDayRange(to)

  const supabase = await createClient()

  const [ordersRes, gastosRes, comprasRes, mermasRes] = await Promise.all([
    fetchAllRows<{ items: unknown; created_at: string }>((from, to) =>
      supabase
        .from("orders")
        .select("items, created_at")
        .eq("status_id", 6)
        .is("deleted_at", null)
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: true })
        .range(from, to),
    ),
    fetchAllRows<{ amount: number | string | null; created_at: string }>((from, to) =>
      supabase
        .from("gastos")
        .select("amount, created_at")
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: true })
        .range(from, to),
    ),
    fetchAllRows<{ amount: number | string | null; created_at: string }>((from, to) =>
      supabase
        .from("compras")
        .select("amount, created_at")
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: true })
        .range(from, to),
    ),
    fetchAllRows<{ items: unknown; created_at: string }>((from, to) =>
      supabase
        .from("mermas")
        .select("items, created_at")
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: true })
        .range(from, to),
    ),
  ])

  if (!ordersRes.data || !gastosRes.data || !comprasRes.data || !mermasRes.data) {
    const error =
      ordersRes.error ?? gastosRes.error ?? comprasRes.error ?? mermasRes.error
    return serverError(error)
  }

  const salesByDay = new Map<string, { ventas: number; costo: number; gananciaBruta: number; pedidos: number }>()
  for (const order of ordersRes.data) {
    const key = nicaDate(order.created_at)
    const entry =
      salesByDay.get(key) ?? { ventas: 0, costo: 0, gananciaBruta: 0, pedidos: 0 }
    entry.pedidos += 1
    for (const item of parseOrderItems(order.items)) {
      const cantidad = toNumber(item.quantity)
      if (cantidad <= 0) continue
      const venta = toNumber(item.price)
      const compra = toNumber(item.purchasePrice)
      entry.ventas += venta * cantidad
      entry.costo += compra * cantidad
      entry.gananciaBruta += (venta - compra) * cantidad
    }
    salesByDay.set(key, entry)
  }

  const gastosByDay = new Map<string, number>()
  for (const gasto of gastosRes.data) {
    const key = nicaDate(gasto.created_at)
    gastosByDay.set(key, (gastosByDay.get(key) ?? 0) + toNumber(gasto.amount))
  }

  const comprasByDay = new Map<string, number>()
  for (const compra of comprasRes.data) {
    const key = nicaDate(compra.created_at)
    comprasByDay.set(key, (comprasByDay.get(key) ?? 0) + toNumber(compra.amount))
  }

  const mermasByDay = new Map<string, number>()
  for (const merma of mermasRes.data) {
    const key = nicaDate(merma.created_at)
    const perdida = parseMermaItems(merma.items).reduce(
      (sum, item) => sum + toNumber(item.purchasePrice) * toNumber(item.quantity),
      0,
    )
    mermasByDay.set(key, (mermasByDay.get(key) ?? 0) + perdida)
  }

  const summary: ResumenReportSummary = {
    pedidos: 0,
    ventas: 0,
    costo: 0,
    gananciaBruta: 0,
    gastos: 0,
    perdidaMermas: 0,
    compras: 0,
    gananciaNeta: 0,
    flujoCaja: 0,
  }

  const days: ResumenDiaRow[] = localDates(from, to).map((fecha) => {
    const sales = salesByDay.get(fecha)
    const row: ResumenDiaRow = {
      fecha,
      ventas: round2(sales?.ventas ?? 0),
      costo: round2(sales?.costo ?? 0),
      gananciaBruta: round2(sales?.gananciaBruta ?? 0),
      gastos: round2(gastosByDay.get(fecha) ?? 0),
      mermas: round2(mermasByDay.get(fecha) ?? 0),
      compras: round2(comprasByDay.get(fecha) ?? 0),
    }
    summary.pedidos += sales?.pedidos ?? 0
    summary.ventas += row.ventas
    summary.costo += row.costo
    summary.gananciaBruta += row.gananciaBruta
    summary.gastos += row.gastos
    summary.perdidaMermas += row.mermas
    summary.compras += row.compras
    return row
  })

  summary.gananciaNeta = round2(summary.gananciaBruta - summary.gastos - summary.perdidaMermas)
  summary.flujoCaja = round2(summary.ventas - summary.gastos - summary.compras)

  const dto: ResumenReportDto = { from, to, days, summary }

  return ok(dto)
}

function localDates(from: string, to: string): string[] {
  const [fy, fm, fd] = from.split("-").map(Number)
  const [ty, tm, td] = to.split("-").map(Number)
  const dates: string[] = []
  const cursor = new Date(Date.UTC(fy, fm - 1, fd))
  const last = new Date(Date.UTC(ty, tm - 1, td))
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return dates
}