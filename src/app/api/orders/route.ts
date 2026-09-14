import {
  badRequest,
  created,
  forbidden,
  ok,
  serverError,
} from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { orderHasStock, type StockMap } from "@/features/orders/lib/stock"
import {
  computeOrderTotal,
  generateAndStoreProforma,
  snapshotPurchasePrice,
  STORE_ROW_ID,
  validateOrderItems,
} from "@/app/api/orders/lib"
import { fetchAllRows, isPaging, paginated, parsePagination } from "@/app/api/pagination"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { OrderDto, OrderItem, OrderStatus, PaymentType } from "@/types/interfaces/order.interface"

// La tienda opera en Nicaragua (UTC-6, sin horario de verano).
// Un día local va de las 06:00 UTC a las 06:00 UTC del día siguiente.
function nicaraguaDayRange(dateStr: string): { start: string; end: string } {
  const [y, m, d] = dateStr.split("-").map(Number)
  const start = new Date(Date.UTC(y, m - 1, d, 6, 0, 0))
  const end = new Date(start.getTime() + 86_400_000)
  return { start: start.toISOString(), end: end.toISOString() }
}

const ORDER_SELECT =
  "id, order_number, customer_name, customer_phone, customer_address, items, total, status_id, payment_type, notes, proforma_url, created_at, order_statuses!inner(name)"

type OrderRow = Record<string, unknown> & {
  id: string
  order_number: string | null
  customer_name: string
  customer_phone: string | null
  customer_address: string | null
  items: OrderItem[]
  total: number | string | null
  status_id: number
  payment_type: string | null
  notes: string | null
  proforma_url: string | null
  created_at: string
  order_statuses: { name: string } | { name: string }[] | null
}

async function mapOrders(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: OrderRow[],
): Promise<OrderDto[]> {
  const productIds = new Set<string>()
  for (const order of rows) {
    for (const item of Array.isArray(order.items) ? order.items : []) {
      if (item.productId) productIds.add(item.productId)
    }
  }

  let stockMap: StockMap = {}
  if (productIds.size > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, stock")
      .in("id", [...productIds])
    stockMap = Object.fromEntries((products ?? []).map((p) => [p.id, Number(p.stock ?? 0)]))
  }

  return rows.map((o) => {
    const items = Array.isArray(o.items) ? o.items : []
    const canApprove = o.status_id === 5 && orderHasStock(items, stockMap)
    const rawStatus = (o.order_statuses as unknown as { name: string } | null)?.name
    const status: OrderStatus =
      rawStatus === "Aprobado" || rawStatus === "Rechazado" ? rawStatus : "En proceso"
    return {
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      customerAddress: o.customer_address ?? null,
      items,
      total: Number(o.total),
      statusId: o.status_id,
      status,
      paymentType: (o.payment_type as PaymentType) || "contado",
      notes: o.notes,
      proformaUrl: o.proforma_url ?? null,
      createdAt: o.created_at,
      canApprove,
    }
  })
}

export async function GET(request: Request) {
  const guard = await requirePermission("pedidos:ver")
  if (!guard.ok) return guard.response!

  const url = new URL(request.url)
  const statusFilter = url.searchParams.get("status")
  const dateFilter = url.searchParams.get("date")
  const search = url.searchParams.get("search")
  const paging = parsePagination(url)

  const supabase = await createClient()

  const buildQuery = () => {
    let query = supabase.from("orders").select(ORDER_SELECT, { count: "exact" }).is("deleted_at", null)

    if (statusFilter && statusFilter !== "todos") {
      const statusMap: Record<string, number> = {
        "en_proceso": 5,
        "aprobado": 6,
        "rechazado": 7,
      }
      const statusId = statusMap[statusFilter]
      if (statusId) query = query.eq("status_id", statusId)
    }

    if (dateFilter) {
      const { start, end } = nicaraguaDayRange(dateFilter)
      query = query.gte("created_at", start).lt("created_at", end)
    }

    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,order_number.ilike.%${search}%`)
    }

    return query.order("created_at", { ascending: false })
  }

  if (isPaging(url)) {
    const { data, count, error } = await buildQuery().range(paging.from, paging.to)
    if (error) return serverError(error)
    const orders = await mapOrders(supabase, (data ?? []) as OrderRow[])
    return ok(paginated(orders, count ?? 0, paging.page, paging.pageSize))
  }

  const rows = await fetchAllRows<OrderRow>((from, to) => buildQuery().range(from, to))
  if (!rows.data) return serverError(rows.error)
  const orders = await mapOrders(supabase, rows.data)
  return ok(orders)
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const customerName = (body.customerName as string)?.trim()
  const customerAddress = (body.customerAddress as string)?.trim() || null
  const rawItems = body.items

  if (!customerName) return badRequest("El nombre del cliente es obligatorio")

  // Normaliza y valida cada item (fracciones hasta 3 decimales y precio de
  // venta = oficial, con descuento o precio pactado). El total se recalcula
  // server-side, jamás se confía del cuerpo de la petición.
  const validated = validateOrderItems(rawItems)
  if (!validated.ok) return badRequest(validated.error)
  const items = validated.items
  const total = computeOrderTotal(items)

  const supabase = createAdminClient()

  // Si la tienda deshabilitó los pagos en cuotas, se fuerza contado.
  const { data: storeProfile } = await supabase
    .from("store_profile")
    .select("payment_plans_enabled")
    .eq("id", STORE_ROW_ID)
    .maybeSingle()
  const paymentType =
    storeProfile?.payment_plans_enabled === false
      ? "contado"
      : ((body.paymentType as string) || "contado")

  // Snapshot del precio de compra vigente de cada producto (reporte de ganancias).
  const itemsWithSnapshot = await snapshotPurchasePrice(supabase, items)

  const { data: nextNumber, error: seqError } = await supabase.rpc("next_order_number")
  if (seqError || typeof nextNumber !== "string") {
    if (seqError?.code === "42501") return forbidden()
    return serverError(seqError ?? new Error("No se pudo generar el número de pedido"))
  }
  const orderNumber = nextNumber

  const { data, error } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      customer_name: customerName,
      customer_phone: (body.customerPhone as string)?.trim() || null,
      customer_address: customerAddress,
      items: itemsWithSnapshot,
      total,
      status_id: 5,
      payment_type: paymentType,
      notes: (body.notes as string)?.trim() || null,
    })
    .select("id, order_number, customer_name, customer_phone, customer_address, items, total, status_id, payment_type, notes, created_at")
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  let createdCanApprove = false
  const createdProductIds = [...new Set(items.map((item) => item.productId).filter(Boolean))] as string[]
  if (createdProductIds.length > 0) {
    const { data: createdProducts } = await supabase
      .from("products")
      .select("id, stock")
      .in("id", createdProductIds)
    const createdStockMap: StockMap = Object.fromEntries(
      (createdProducts ?? []).map((p) => [p.id, Number(p.stock ?? 0)]),
    )
    createdCanApprove = orderHasStock(items, createdStockMap)
  }

  const proformaUrl = await generateAndStoreProforma(supabase, {
    id: data.id,
    order_number: data.order_number,
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    items: Array.isArray(data.items) ? (data.items as OrderItem[]) : [],
    total: Number(data.total),
    payment_type: data.payment_type,
  })

  return created({
    id: data.id,
    orderNumber: data.order_number,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    customerAddress: data.customer_address ?? null,
    items: Array.isArray(data.items) ? data.items : [],
    total: Number(data.total),
    statusId: data.status_id,
    status: "En proceso",
    paymentType: data.payment_type,
    notes: data.notes,
    proformaUrl,
    createdAt: data.created_at,
    canApprove: createdCanApprove,
  })
}
