import {
  badRequest,
  created,
  forbidden,
  ok,
  serverError,
} from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { orderHasStock, type StockMap } from "@/features/orders/lib/stock"
import { generateProformaPdf } from "@/features/catalog/lib/proforma"
import type { BankAccountInfo } from "@/features/catalog/lib/whatsapp"
import { getAssetUrl, sanitizeStorageKeySegment } from "@/lib/assets"
import { decryptBankAccountNumber } from "@/lib/encrypt"
import { fetchAllRows, isPaging, paginated, parsePagination } from "@/app/api/pagination"
import { isValidQty, round2, roundQty } from "@/lib/format"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { OrderDto, OrderItem, OrderStatus, PaymentType } from "@/types/interfaces/order.interface"

const STORE_ROW_ID = "00000000-0000-0000-0000-000000000001"
const PROFORMA_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "rutex-storage"

// La tienda opera en Nicaragua (UTC-6, sin horario de verano).
// Un día local va de las 06:00 UTC a las 06:00 UTC del día siguiente.
function nicaraguaDayRange(dateStr: string): { start: string; end: string } {
  const [y, m, d] = dateStr.split("-").map(Number)
  const start = new Date(Date.UTC(y, m - 1, d, 6, 0, 0))
  const end = new Date(start.getTime() + 86_400_000)
  return { start: start.toISOString(), end: end.toISOString() }
}

/**
 * Genera y sube la proforma del pedido recién creado y guarda su URL en la BD.
 * Best-effort: cualquier fallo devuelve null sin bloquear el alta del pedido.
 */
async function generateAndStoreProforma(
  supabase: ReturnType<typeof createAdminClient>,
  order: {
    id: string
    order_number: string | null
    customer_name: string
    customer_phone: string | null
    items: OrderItem[]
    total: number
    payment_type: string | null
  },
): Promise<string | null> {
  try {
    const { data: profile } = await supabase
      .from("store_profile")
      .select("name, phone, address")
      .eq("id", STORE_ROW_ID)
      .maybeSingle()

    const { data: bankRows = [] } = await supabase
      .from("bank_accounts")
      .select("bank_name, account_number, account_holder, currency")
      .eq("store_profile_id", STORE_ROW_ID)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })

    const bankAccounts: BankAccountInfo[] = (bankRows ?? []).map((a) => ({
      bankName: a.bank_name,
      accountNumber: decryptBankAccountNumber(a.account_number),
      accountHolder: a.account_holder,
      currency: a.currency ?? "C$",
    }))

    const pdf = generateProformaPdf({
      storeName: profile?.name ?? "Rutex",
      storeAddress: profile?.address ?? null,
      storePhone: profile?.phone ?? null,
      customerName: order.customer_name,
      customerPhone: order.customer_phone ?? "",
      orderNumber: order.order_number,
      items: order.items,
      total: order.total,
      paymentType: (order.payment_type as PaymentType) || "contado",
      bankAccounts,
    })

    const slug = sanitizeStorageKeySegment(order.customer_name, "cliente")
    const now = new Date()
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 8)}`
    const path = `proformas/proforma-${slug}-${stamp}.pdf`

    const { data, error } = await supabase.storage.from(PROFORMA_BUCKET).upload(
      path,
      pdf.output("arraybuffer") as ArrayBuffer,
      {
        contentType: "application/pdf",
        cacheControl: "3600",
        upsert: false,
      },
    )

    if (error) return null

    const url = getAssetUrl(data?.path ?? path)
    await supabase.from("orders").update({ proforma_url: url }).eq("id", order.id)
    return url
  } catch {
    return null
  }
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
  if (!Array.isArray(rawItems) || rawItems.length === 0) return badRequest("El pedido debe tener al menos un producto")

  // Normaliza y valida cada item. La cantidad admite fracciones (hasta 3
  // decimales: 0.5, 1.25…) y el precio de venta es el que envía el cliente
  // (precio oficial, con descuento o precio pactado) — solo se sanea.
  const items: Array<{ productId: string; productName: string; price: number; quantity: number }> = []
  for (const raw of rawItems as Array<Record<string, unknown>>) {
    if (!raw || typeof raw !== "object") return badRequest("Hay un ítem de pedido inválido")
    const productId = typeof raw.productId === "string" ? raw.productId.trim() : ""
    const productName = typeof raw.productName === "string" ? raw.productName.trim() : ""
    const quantity = Number(raw.quantity)
    const price = Number(raw.price)
    if (!productId || !productName) return badRequest("Hay un producto sin identificar en el pedido")
    if (!isValidQty(quantity)) {
      return badRequest(`Cantidad inválida para "${productName}": usa un número mayor a 0 con hasta 3 decimales`)
    }
    if (!Number.isFinite(price) || price < 0) return badRequest(`Precio inválido para "${productName}"`)
    items.push({ productId, productName, price: round2(price), quantity: roundQty(quantity) })
  }

  const total = round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0))

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
  const snapshotProductIds = [...new Set(items.map((item) => item.productId).filter(Boolean))] as string[]
  const { data: snapshotProducts } = await supabase
    .from("products")
    .select("id, purchase_price")
    .in("id", snapshotProductIds)
  const purchasePriceById = new Map(
    (snapshotProducts ?? []).map((p) => [p.id, Number(p.purchase_price ?? 0) || 0]),
  )
  const itemsWithSnapshot = items.map((item) => ({
    ...item,
    purchasePrice: purchasePriceById.get(item.productId) ?? 0,
  }))

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
