import { ok, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import {
  nicaraguaDayRange,
  parseReportRange,
  round2,
  toNumber,
} from "@/app/api/reports/helpers"
import type { HourSalesReportDto, HourSalesReportRow } from "@/types/interfaces/report.interface"

/**
 * Reporte de horario de compras: agrupa los pedidos APROBADOS del rango
 * por hora del día (hora de Nicaragua) y suma pedidos e ingresos. Ayuda a
 * detectar en qué horas del día se concentra la venta.
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
    .select("total, created_at")
    .eq("status_id", 6)
    .is("deleted_at", null)
    .gte("created_at", start)
    .lt("created_at", end)

  if (error) return serverError(error)

  const byHour = new Map<number, { pedidos: number; ventas: number }>()
  for (const order of data ?? []) {
    const date = new Date(order.created_at)
    const hour = (date.getUTCHours() - 6 + 24) % 24
    const agg = byHour.get(hour) ?? { pedidos: 0, ventas: 0 }
    agg.pedidos += 1
    agg.ventas += toNumber(order.total)
    byHour.set(hour, agg)
  }

  const rows: HourSalesReportRow[] = [...byHour.entries()]
    .map(([hora, agg]) => ({ hora, pedidos: agg.pedidos, ventas: round2(agg.ventas) }))
    .sort((a, b) => a.hora - b.hora)

  let horarioPico: number | null = null
  if (rows.length > 0) {
    horarioPico = rows.reduce((pico, row) => (row.pedidos > pico.pedidos ? row : pico), rows[0]).hora
  }

  const dto: HourSalesReportDto = {
    from,
    to,
    rows,
    summary: {
      pedidos: round2(rows.reduce((sum, row) => sum + row.pedidos, 0)),
      ventas: round2(rows.reduce((sum, row) => sum + row.ventas, 0)),
      horarioPico,
    },
  }

  return ok(dto)
}