import {
  ok,
  serverError,
} from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import { nicaraguaDayRange } from "@/app/api/reports/helpers"
import { fetchAllRows, isPaging, paginated, parsePagination } from "@/app/api/pagination"
import { DELIVERY_SELECT, mapDelivery, type DeliveryRow } from "@/app/api/deliveries/helpers"

const STATUS_MAP: Record<string, number> = {
  en_almacen: 1,
  en_ruta: 2,
  entregado: 3,
}

export async function GET(request: Request) {
  const guard = await requirePermission("almacen:ver")
  if (!guard.ok) return guard.response!

  const url = new URL(request.url)
  const search = url.searchParams.get("search")?.trim() || undefined
  const dateFilter = url.searchParams.get("date")
  const statusId = url.searchParams.get("status")
    ? STATUS_MAP[url.searchParams.get("status")!]
    : undefined
  const paging = parsePagination(url)

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildQuery = (): any => {
    // Para buscar en columnas de orders (relación to-one) se usan embeds "vacíos"
    // con alias (o1/o2/o3) y un filtro OR a nivel raíz (patrón documentado de PostgREST).
    const select = search
      ? `${DELIVERY_SELECT}, o1:orders(order_number), o2:orders(customer_name), o3:orders(customer_phone)`
      : DELIVERY_SELECT
    let query = supabase.from("deliveries").select(select, { count: "exact" })
    if (statusId) query = query.eq("status_id", statusId)
    if (dateFilter) {
      const { start, end } = nicaraguaDayRange(dateFilter)
      query = query.gte("entered_at", start).lt("entered_at", end)
    }
    if (search) {
      query = query
        .ilike("o1.order_number", `%${search}%`)
        .ilike("o2.customer_name", `%${search}%`)
        .ilike("o3.customer_phone", `%${search}%`)
        .or("o1.not.is.null,o2.not.is.null,o3.not.is.null")
    }
    return query.order("entered_at", { ascending: false })
  }

  if (isPaging(url)) {
    const { data, count, error } = await buildQuery().range(paging.from, paging.to)
    if (error) return serverError(error)
    return ok(paginated((data ?? []).map(mapDelivery), count ?? 0, paging.page, paging.pageSize))
  }

  const rows = await fetchAllRows<DeliveryRow>((from, to) => buildQuery().range(from, to))
  if (!rows.data) return serverError(rows.error)
  return ok(rows.data.map(mapDelivery))
}