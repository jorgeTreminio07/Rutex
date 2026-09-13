import { badRequest, ok, serverError } from "@/lib/api-response"
import { requireAdmin } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import type { ProfitReportDto, ProfitReportRow } from "@/types/interfaces/report.interface"

// Día en Nicaragua (UTC-6, sin horario de verano):
// un día local va de las 06:00 UTC a las 06:00 UTC del día siguiente.
function nicaraguaDayRange(dateStr: string): { start: string; end: string } {
  const [y, m, d] = dateStr.split("-").map(Number)
  const start = new Date(Date.UTC(y, m - 1, d, 6, 0, 0))
  const end = new Date(start.getTime() + 86_400_000)
  return { start: start.toISOString(), end: end.toISOString() }
}

function nicaToday(): string {
  return new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function nicaDate(dateStr: string): string {
  return new Date(new Date(dateStr).getTime() - 6 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value) || 0
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

/**
 * Reporte de ganancias: por cada producto vendido en pedidos APROBADOS,
 * compara el precio de compra (snapshot al crear el pedido) con el precio
 * de venta. `ganancia` por línea = (precioVenta - precioCompra) * cantidad.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const url = new URL(request.url)
  const defaultDate = nicaToday()
  let from = url.searchParams.get("from")?.trim() || defaultDate
  let to = url.searchParams.get("to")?.trim() || from

  if (!DATE_REGEX.test(from) || !DATE_REGEX.test(to)) {
    return badRequest("Fechas inválidas. Usa el formato YYYY-MM-DD")
  }
  if (to < from) [from, to] = [to, from]

  const { start } = nicaraguaDayRange(from)
  const { end } = nicaraguaDayRange(to)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, items, created_at")
    .eq("status_id", 6)
    .is("deleted_at", null)
    .gte("created_at", start)
    .lt("created_at", end)
    .order("created_at", { ascending: true })
    .order("order_number", { ascending: true })

  if (error) return serverError(error)

  const rows: ProfitReportRow[] = []
  for (const order of data ?? []) {
    const fecha = nicaDate(order.created_at)
    const items = Array.isArray(order.items) ? order.items : []
    for (const item of items) {
      const cantidad = toNumber(item?.quantity)
      if (cantidad <= 0) continue
      const precioVenta = toNumber(item?.price)
      const precioCompra = toNumber(item?.purchasePrice)
      rows.push({
        fecha,
        orderNumber: order.order_number,
        productName: String(item?.productName ?? "Producto"),
        cantidad,
        precioCompra: round2(precioCompra),
        precioVenta: round2(precioVenta),
        ganancia: round2((precioVenta - precioCompra) * cantidad),
      })
    }
  }

  const dto: ProfitReportDto = {
    from,
    to,
    rows,
    summary: {
      pedidos: data?.length ?? 0,
      unidades: round2(rows.reduce((sum, row) => sum + row.cantidad, 0)),
      ventas: round2(rows.reduce((sum, row) => sum + row.precioVenta * row.cantidad, 0)),
      costo: round2(rows.reduce((sum, row) => sum + row.precioCompra * row.cantidad, 0)),
      ganancia: round2(rows.reduce((sum, row) => sum + row.ganancia, 0)),
    },
  }

  return ok(dto)
}