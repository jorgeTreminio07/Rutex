import { ok, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import {
  nicaraguaDayRange,
  parseOrderItems,
  parseReportRange,
  round2,
  toNumber,
} from "@/app/api/reports/helpers"
import type {
  ClientSalesReportDto,
  ClientSalesReportRow,
} from "@/types/interfaces/report.interface"

/**
 * Reporte de pedidos por cliente: agrupa los pedidos APROBADOS del rango
 * por cliente (nombre) y suma pedidos, unidades, ingresos y ganancia.
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
  const { data, error } = await supabase
    .from("orders")
    .select("customer_name, items")
    .eq("status_id", 6)
    .is("deleted_at", null)
    .gte("created_at", start)
    .lt("created_at", end)

  if (error) return serverError(error)

  const byClient = new Map<string, { pedidos: number; unidades: number; ventas: number; ganancia: number }>()

  for (const order of data ?? []) {
    const cliente = String(order.customer_name ?? "Sin nombre")
    let agg = byClient.get(cliente)
    if (!agg) {
      agg = { pedidos: 0, unidades: 0, ventas: 0, ganancia: 0 }
      byClient.set(cliente, agg)
    }
    agg.pedidos += 1
    for (const item of parseOrderItems(order.items)) {
      const cantidad = toNumber(item?.quantity)
      if (cantidad <= 0) continue
      const precioVenta = toNumber(item?.price)
      const precioCompra = toNumber(item?.purchasePrice)
      agg.unidades += cantidad
      agg.ventas += precioVenta * cantidad
      agg.ganancia += (precioVenta - precioCompra) * cantidad
    }
  }

  const rows: ClientSalesReportRow[] = [...byClient.entries()]
    .map(([cliente, agg]) => ({
      cliente,
      pedidos: agg.pedidos,
      unidades: agg.unidades,
      ventas: round2(agg.ventas),
      ganancia: round2(agg.ganancia),
    }))
    .sort((a, b) => b.ventas - a.ventas)

  const dto: ClientSalesReportDto = {
    from,
    to,
    rows,
    summary: {
      clientes: rows.length,
      pedidos: round2(rows.reduce((sum, row) => sum + row.pedidos, 0)),
      unidades: round2(rows.reduce((sum, row) => sum + row.unidades, 0)),
      ventas: round2(rows.reduce((sum, row) => sum + row.ventas, 0)),
      ganancia: round2(rows.reduce((sum, row) => sum + row.ganancia, 0)),
    },
  }

  return ok(dto)
}