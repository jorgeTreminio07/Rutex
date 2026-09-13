import { ok, serverError } from "@/lib/api-response"
import { requireAdmin } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import {
  nicaraguaDayRange,
  nicaDate,
  parseOrderItems,
  parseReportRange,
  round2,
  toNumber,
} from "@/app/api/reports/helpers"
import type { ProfitReportDto, ProfitReportRow } from "@/types/interfaces/report.interface"

/**
 * Reporte de ganancias: por cada producto vendido en pedidos APROBADOS,
 * compara el precio de compra (snapshot al crear el pedido) con el precio
 * de venta. `ganancia` por línea = (precioVenta - precioCompra) * cantidad.
 */
export async function GET(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const range = parseReportRange(new URL(request.url))
  if (!range.ok) return range.response
  const { from, to } = range

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
    for (const item of parseOrderItems(order.items)) {
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