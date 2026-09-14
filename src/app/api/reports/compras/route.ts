import { ok, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import { fetchAllRows } from "@/app/api/pagination"
import {
  nicaraguaDayRange,
  nicaDate,
  parseReportRange,
  round2,
  toNumber,
} from "@/app/api/reports/helpers"
import type { CompraReportDto, CompraReportRow } from "@/types/interfaces/report.interface"

/**
 * Reporte de compras: una fila por compra registrada en el rango, con
 * proveedor (snapshot) y monto.
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
  const result = await fetchAllRows<{
    title: string
    supplier_name: string | null
    amount: number | string | null
    created_at: string
  }>((from, to) =>
    supabase
      .from("compras")
      .select("title, supplier_name, amount, created_at")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true })
      .range(from, to),
  )

  if (!result.data) return serverError(result.error)

  const rows: CompraReportRow[] = (result.data ?? []).map((compra) => ({
    fecha: nicaDate(compra.created_at),
    titulo: compra.title,
    proveedor: compra.supplier_name ?? null,
    monto: round2(toNumber(compra.amount)),
  }))

  const proveedores = new Set(rows.map((r) => r.proveedor).filter(Boolean))

  const dto: CompraReportDto = {
    from,
    to,
    rows,
    summary: {
      compras: rows.length,
      total: round2(rows.reduce((sum, row) => sum + row.monto, 0)),
      proveedores: proveedores.size,
    },
  }

  return ok(dto)
}