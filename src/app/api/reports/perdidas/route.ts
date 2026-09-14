import { ok, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import { fetchAllRows } from "@/app/api/pagination"
import {
  nicaraguaDayRange,
  nicaDate,
  parseMermaItems,
  parseReportRange,
  round2,
  toNumber,
} from "@/app/api/reports/helpers"
import type { PerdidaReportDto, PerdidaReportRow } from "@/types/interfaces/report.interface"

const MERMA_SELECT = "merma_number, items, created_at, merma_motivos!inner(name)"

/**
 * Reporte de pérdidas: aplanar los productos mermados en el rango. Por línea
 * muestra la pérdida económica real (costo de compra × cantidad) y el valor
 * de venta perdido (oportunidad).
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
    merma_number: string
    items: unknown
    created_at: string
    merma_motivos: unknown
  }>((from, to) =>
    supabase
      .from("mermas")
      .select(MERMA_SELECT)
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true })
      .range(from, to),
  )

  if (!result.data) return serverError(result.error)

  const rows: PerdidaReportRow[] = []
  for (const merma of result.data ?? []) {
    const fecha = nicaDate(merma.created_at)
    const motivo = (merma.merma_motivos as { name?: string } | null)?.name ?? "—"
    for (const item of parseMermaItems(merma.items)) {
      const cantidad = toNumber(item.quantity)
      if (cantidad <= 0) continue
      const costo = toNumber(item.purchasePrice)
      const venta = toNumber(item.sellPrice)
      rows.push({
        fecha,
        mermaNumber: merma.merma_number,
        motivo,
        producto: String(item.productName ?? "Producto"),
        cantidad,
        costoPerdido: round2(costo * cantidad),
        valorVentaPerdido: round2(venta * cantidad),
      })
    }
  }

  const dto: PerdidaReportDto = {
    from,
    to,
    rows,
    summary: {
      mermas: result.data?.length ?? 0,
      unidades: round2(rows.reduce((sum, row) => sum + row.cantidad, 0)),
      costoPerdido: round2(rows.reduce((sum, row) => sum + row.costoPerdido, 0)),
      valorVentaPerdido: round2(
        rows.reduce((sum, row) => sum + row.valorVentaPerdido, 0),
      ),
    },
  }

  return ok(dto)
}