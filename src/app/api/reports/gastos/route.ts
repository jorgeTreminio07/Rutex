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
import type { GastoReportDto, GastoReportRow } from "@/types/interfaces/report.interface"

/**
 * Reporte de gastos: una fila por gasto registrado en el rango, con su monto.
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
    observation: string | null
    amount: number | string | null
    created_at: string
  }>((from, to) =>
    supabase
      .from("gastos")
      .select("title, observation, amount, created_at")
      .gte("created_at", start)
      .lt("created_at", end)
      .order("created_at", { ascending: true })
      .range(from, to),
  )

  if (!result.data) return serverError(result.error)

  const rows: GastoReportRow[] = (result.data ?? []).map((gasto) => ({
    fecha: nicaDate(gasto.created_at),
    titulo: gasto.title,
    observacion: gasto.observation ?? null,
    monto: round2(toNumber(gasto.amount)),
  }))

  const dto: GastoReportDto = {
    from,
    to,
    rows,
    summary: {
      gastos: rows.length,
      total: round2(rows.reduce((sum, row) => sum + row.monto, 0)),
    },
  }

  return ok(dto)
}