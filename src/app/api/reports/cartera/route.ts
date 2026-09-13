import { ok, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import { fetchAllRows } from "@/app/api/pagination"
import { nicaToday, parseReportRange, round2, toNumber } from "@/app/api/reports/helpers"
import type {
  CarteraReportDto,
  CarteraReportRow,
  CuotaEstado,
} from "@/types/interfaces/report.interface"

interface AbonoFull {
  id: string
  order_id: string
  fecha_a_abonar: string
  monto_a_abonar: number | null
  abonado: number | null
  pagado: boolean | null
  created_at: string | null
}

/**
 * Reporte de cartera por período: muestra las cuotas (abonos) cuyo día de
 * pago cae dentro del rango, con el cliente, cuota N de M, monto, abonado,
 * estado (Pagado / Vencido / Pendiente) y saldo.
 */
export async function GET(request: Request) {
  const guard = await requirePermission("reportes:ver")
  if (!guard.ok) return guard.response!

  const range = parseReportRange(new URL(request.url))
  if (!range.ok) return range.response
  const { from, to } = range

  const supabase = await createClient()

  const pagosResult = await fetchAllRows<{ order_id: string }>((from, to) =>
    supabase.from("pagos").select("order_id").range(from, to),
  )
  if (!pagosResult.data) return serverError(pagosResult.error)

  const orderIds = pagosResult.data.map((p) => p.order_id)

  const rows: CarteraReportRow[] = []
  if (orderIds.length > 0) {
    const abonosResult = await fetchAllRows<AbonoFull>((from, to) =>
      supabase
        .from("abonos")
        .select("id, order_id, fecha_a_abonar, monto_a_abonar, abonado, pagado, created_at")
        .in("order_id", orderIds)
        .gte("fecha_a_abonar", from)
        .lte("fecha_a_abonar", to)
        .order("fecha_a_abonar", { ascending: true })
        .range(from, to),
    )
    if (!abonosResult.data) return serverError(abonosResult.error)

    const abonosEnRango = abonosResult.data

    const involvedOrderIds = [...new Set(abonosEnRango.map((a) => a.order_id))]

    if (involvedOrderIds.length > 0) {
      const [ordersResult, abonosPlanResult] = await Promise.all([
        fetchAllRows<{ id: string; order_number: string | null; customer_name: string | null }>(
          (from, to) =>
            supabase
              .from("orders")
              .select("id, order_number, customer_name")
              .in("id", involvedOrderIds)
              .is("deleted_at", null)
              .range(from, to),
        ),
        fetchAllRows<{ id: string; order_id: string }>((from, to) =>
          supabase
            .from("abonos")
            .select("id, order_id, fecha_a_abonar")
            .in("order_id", involvedOrderIds)
            .order("fecha_a_abonar", { ascending: true })
            .order("id", { ascending: true })
            .range(from, to),
        ),
      ])

      if (!ordersResult.data) return serverError(ordersResult.error)
      if (!abonosPlanResult.data) return serverError(abonosPlanResult.error)

      const ordersRes = { data: ordersResult.data }
      const abonosPlanRes = { data: abonosPlanResult.data }

      const orderById = new Map(
        (ordersRes.data ?? []).map((o) => [
          o.id,
          { orderNumber: o.order_number as string | null, customerName: o.customer_name as string },
        ]),
      )

      const planByOrder = new Map<string, string[]>()
      for (const a of (abonosPlanRes.data ?? []) as { id: string; order_id: string }[]) {
        const list = planByOrder.get(a.order_id) ?? []
        list.push(a.id)
        planByOrder.set(a.order_id, list)
      }

      const today = nicaToday()
      for (const abono of (abonosEnRango ?? []) as AbonoFull[]) {
        const order = orderById.get(abono.order_id)
        if (!order) continue

        const monto = round2(toNumber(abono.monto_a_abonar))
        const abonado = round2(toNumber(abono.abonado))
        const pagado = Boolean(abono.pagado)
        const saldo = round2(Math.max(0, monto - abonado))
        const estado: CuotaEstado = pagado
          ? "Pagado"
          : (abono.fecha_a_abonar ?? "") < today
            ? "Vencido"
            : "Pendiente"

        const plan = planByOrder.get(abono.order_id) ?? []
        const posicion = plan.indexOf(abono.id) + 1

        rows.push({
          orderNumber: order.orderNumber,
          cliente: order.customerName,
          cuota: posicion,
          cuotas: plan.length,
          fechaAbonar: abono.fecha_a_abonar,
          monto,
          abonado,
          estado,
          saldo,
        })
      }
    }
  }

  rows.sort((a, b) => (a.fechaAbonar < b.fechaAbonar ? -1 : a.fechaAbonar > b.fechaAbonar ? 1 : 0))

  const dto: CarteraReportDto = {
    from,
    to,
    rows,
    summary: {
      cuotas: rows.length,
      monto: round2(rows.reduce((sum, row) => sum + row.monto, 0)),
      cobrado: round2(rows.reduce((sum, row) => sum + row.abonado, 0)),
      pendiente: round2(rows.reduce((sum, row) => sum + row.saldo, 0)),
    },
  }

  return ok(dto)
}