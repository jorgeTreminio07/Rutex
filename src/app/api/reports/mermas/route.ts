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
import type { MermaReportDto, MermaReportRow } from "@/types/interfaces/report.interface"

const MERMA_SELECT = "merma_number, items, total_value, created_at, merma_motivos!inner(name)"

/**
 * Reporte de mermas: una fila por merma registrada, con motivo, unidades,
 * costo total y valor a precio de venta.
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
    total_value: number | string | null
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

  const rows: MermaReportRow[] = (result.data ?? []).map((merma) => {
    const items = parseMermaItems(merma.items)
    const motivo = merma.merma_motivos as { name?: string } | null
    const unidades = round2(
      items.reduce((sum, item) => sum + toNumber(item.quantity), 0),
    )
    const costo = round2(
      items.reduce(
        (sum, item) => sum + toNumber(item.purchasePrice) * toNumber(item.quantity),
        0,
      ),
    )
    return {
      fecha: nicaDate(merma.created_at),
      mermaNumber: merma.merma_number,
      motivo: motivo?.name ?? "—",
      unidades,
      costo,
      valorVenta: round2(toNumber(merma.total_value)),
    }
  })

  const dto: MermaReportDto = {
    from,
    to,
    rows,
    summary: {
      mermas: rows.length,
      unidades: round2(rows.reduce((sum, row) => sum + row.unidades, 0)),
      costo: round2(rows.reduce((sum, row) => sum + row.costo, 0)),
      valorVenta: round2(rows.reduce((sum, row) => sum + row.valorVenta, 0)),
    },
  }

  return ok(dto)
}