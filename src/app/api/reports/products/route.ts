import { ok, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import { fetchAllRows } from "@/app/api/pagination"
import {
  nicaraguaDayRange,
  parseOrderItems,
  parseReportRange,
  round2,
  toNumber,
} from "@/app/api/reports/helpers"
import type {
  ProductSalesReportDto,
  ProductSalesReportRow,
} from "@/types/interfaces/report.interface"

/**
 * Reporte de ventas por producto: agrupa los items de los pedidos
 * APROBADOS del rango por producto y suma unidades, ingresos (venta),
 * costo (compra) y ganancia.
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
  const result = await fetchAllRows<{ items: unknown }>((from, to) =>
    supabase
      .from("orders")
      .select("items")
      .eq("status_id", 6)
      .is("deleted_at", null)
      .gte("created_at", start)
      .lt("created_at", end)
      .range(from, to),
  )

  if (!result.data) return serverError(result.error)

  const data = result.data

  const byProduct = new Map<
    string,
    { productId: string | null; productName: string; unidades: number; ventas: number; costo: number }
  >()
  let fallbackIndex = 0

  for (const order of data ?? []) {
    for (const item of parseOrderItems(order.items)) {
      const cantidad = toNumber(item?.quantity)
      if (cantidad <= 0) continue
      const productId = typeof item?.productId === "string" && item.productId ? item.productId : null
      const productName = String(item?.productName ?? "Producto")
      const key = productId ? `id:${productId}` : `name:${productName}:${fallbackIndex++}`

      let agg = byProduct.get(key)
      if (!agg) {
        agg = { productId, productName, unidades: 0, ventas: 0, costo: 0 }
        byProduct.set(key, agg)
      }
      agg.productName = productName
      agg.unidades += cantidad
      agg.ventas += toNumber(item?.price) * cantidad
      agg.costo += toNumber(item?.purchasePrice) * cantidad
    }
  }

  const rows: ProductSalesReportRow[] = [...byProduct.values()]
    .map((agg) => ({
      productId: agg.productId,
      productName: agg.productName,
      cantidad: agg.unidades,
      ventas: round2(agg.ventas),
      costo: round2(agg.costo),
      ganancia: round2(agg.ventas - agg.costo),
    }))
    .sort((a, b) => b.ventas - a.ventas)

  const dto: ProductSalesReportDto = {
    from,
    to,
    rows,
    summary: {
      productos: rows.length,
      unidades: round2(rows.reduce((sum, row) => sum + row.cantidad, 0)),
      ventas: round2(rows.reduce((sum, row) => sum + row.ventas, 0)),
      costo: round2(rows.reduce((sum, row) => sum + row.costo, 0)),
      ganancia: round2(rows.reduce((sum, row) => sum + row.ganancia, 0)),
    },
  }

  return ok(dto)
}