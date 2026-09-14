import {
  badRequest,
  forbidden,
  noContent,
  notFound,
  ok,
  serverError,
} from "@/lib/api-response"
import { requireOneOf, requirePermission } from "@/lib/server/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { recomputePagoEstado } from "@/app/api/cartera/helpers"
import { buildAbonoPlan } from "@/features/cartera/lib/pagos"
import { orderHasStock, type StockMap } from "@/features/orders/lib/stock"
import {
  computeOrderTotal,
  generateAndStoreProforma,
  removeStoredProforma,
  snapshotPurchasePrice,
  STORE_ROW_ID,
  validateOrderItems,
} from "@/app/api/orders/lib"
import type { OrderItem } from "@/types/interfaces/order.interface"

interface RouteContext {
  params: Promise<{ id: string }>
}

type OrderItemRow = { productId?: string; productName?: string; quantity?: number }

const ORDER_DETAIL_SELECT =
  "id, order_number, customer_name, customer_phone, customer_address, items, total, status_id, payment_type, notes, proforma_url, created_at, order_statuses!inner(name)"

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params
  const guard = await requireOneOf(["pedidos:aprobar", "pedidos:rechazar"])
  if (!guard.ok) return guard.response!

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const statusId = Number(body.statusId)
  if (![5, 6, 7].includes(statusId)) return badRequest("Estado inválido")

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from("orders")
    .select("id, status_id, items, total, payment_type")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!existing) return notFound("Pedido no encontrado")

  // Al aprobar, validar stock y descontarlo de los productos incluidos.
  if (statusId === 6 && existing.status_id === 5) {
    const items = (existing.items ?? []) as OrderItemRow[]

    const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))] as string[]
    const { data: products = [] } = productIds.length
      ? await supabase.from("products").select("id, name, stock").in("id", productIds)
      : { data: [] as Array<{ id: string; name: string; stock: number }> }

    const productById = new Map((products ?? []).map((p) => [p.id, p]))

    for (const item of items) {
      if (!item.productId) return badRequest("El pedido contiene productos sin identificar")
      const product = productById.get(item.productId)
      const available = product ? Number(product.stock ?? 0) : 0
      if (!product || available < (item.quantity ?? 0)) {
        const name = product?.name ?? "producto"
        return badRequest(
          `Sin stock suficiente para aprobar: ${name} (disponible ${available})`,
        )
      }
    }

    for (const item of items) {
      if (!item.productId) continue
      const product = productById.get(item.productId)
      if (!product) continue
      await supabase
        .from("products")
        .update({
          stock: Math.max(0, Number(product.stock ?? 0) - (item.quantity ?? 0)),
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.productId)
    }

    // Alta en cartera: fila de pago (Pendiente) + plan de abonos según
    // la modalidad de pago (una sola vez).
    const { data: existingPago } = await supabase
      .from("pagos")
      .select("order_id")
      .eq("order_id", id)
      .maybeSingle()

    if (!existingPago) {
      await supabase.from("pagos").insert({ order_id: id, estado_pago_id: 1 })

      const plan = buildAbonoPlan(String(existing.payment_type ?? "contado"), Number(existing.total ?? 0))
      if (plan.length > 0) {
        await supabase.from("abonos").insert(
          plan.map((abono) => ({
            order_id: id,
            fecha_a_abonar: abono.fecha,
            monto_a_abonar: abono.monto,
            abonado: 0,
            pagado: false,
          })),
        )
      }

      await recomputePagoEstado(supabase, id)
    }

    // Alta en almacén: una entrega por pedido aprobado (solo la primera vez).
    const { data: existingDelivery, error: deliverySelectError } = await supabase
      .from("deliveries")
      .select("id")
      .eq("order_id", id)
      .maybeSingle()

    if (deliverySelectError) return serverError(deliverySelectError)

    if (!existingDelivery) {
      const { error: deliveryInsertError } = await supabase
        .from("deliveries")
        .insert({ order_id: id, status_id: 1 })
      if (deliveryInsertError) return serverError(deliveryInsertError)
    }
  }

  const { data, error } = await supabase
    .from("orders")
    .update({
      status_id: statusId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(ORDER_DETAIL_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return ok({
    id: data.id,
    orderNumber: data.order_number,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    customerAddress: data.customer_address ?? null,
    items: Array.isArray(data.items) ? data.items : [],
    total: Number(data.total),
    statusId: data.status_id,
    status: (data.order_statuses as unknown as { name: string })?.name || "En proceso",
    paymentType: data.payment_type,
    notes: data.notes,
    proformaUrl: data.proforma_url ?? null,
    createdAt: data.created_at,
    canApprove: false,
  })
}

/**
 * Edita un pedido que sigue EN PROCESO (status 5): actualiza items, total,
 * cliente, modalidad de pago y notas, y regenera la proforma. No toca stock
 * (solo se descuenta al aprobar), ni cartera, ni almacén.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params
  const guard = await requirePermission("pedidos:crear")
  if (!guard.ok) return guard.response!

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const customerName = (body.customerName as string)?.trim()
  const customerAddress = (body.customerAddress as string)?.trim() || null
  if (!customerName) return badRequest("El nombre del cliente es obligatorio")

  const validated = validateOrderItems(body.items)
  if (!validated.ok) return badRequest(validated.error)
  const items = validated.items
  const total = computeOrderTotal(items)

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from("orders")
    .select("id, status_id, proforma_url")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!existing) return notFound("Pedido no encontrado")
  if (existing.status_id !== 5) {
    return badRequest("Solo se pueden editar pedidos En proceso")
  }

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

  const itemsWithSnapshot = await snapshotPurchasePrice(supabase, items)

  const { data, error } = await supabase
    .from("orders")
    .update({
      items: itemsWithSnapshot,
      total,
      customer_name: customerName,
      customer_phone: (body.customerPhone as string)?.trim() || null,
      customer_address: customerAddress,
      payment_type: paymentType,
      notes: (body.notes as string)?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(ORDER_DETAIL_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  // Regenerar la proforma con los datos editados. Primero se genera y persiste
  // la nueva URL (best-effort); solo si tuvo éxito se borra la proforma vieja
  // del Storage para no dejar huérfanos ni romper una URL aún vigente.
  const oldProformaUrl = existing.proforma_url
  let proformaUrl = oldProformaUrl ?? null
  const regenerated = await generateAndStoreProforma(supabase, {
    id: data.id,
    order_number: data.order_number,
    customer_name: data.customer_name,
    customer_phone: data.customer_phone,
    items: Array.isArray(data.items) ? (data.items as OrderItem[]) : [],
    total: Number(data.total),
    payment_type: data.payment_type,
  })
  if (regenerated) {
    proformaUrl = regenerated
    await removeStoredProforma(supabase, oldProformaUrl)
  }

  // canApprove con los items editados contra el stock actual (el pedido aún
  // no descontó stock por estar En proceso).
  const productIds = [...new Set(items.map((item) => item.productId).filter(Boolean))] as string[]
  let canApprove = false
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from("products")
      .select("id, stock")
      .in("id", productIds)
    const stockMap: StockMap = Object.fromEntries(
      (products ?? []).map((p) => [p.id, Number(p.stock ?? 0)]),
    )
    canApprove = orderHasStock(items, stockMap)
  }

  return ok({
    id: data.id,
    orderNumber: data.order_number,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    customerAddress: data.customer_address ?? null,
    items: Array.isArray(data.items) ? data.items : [],
    total: Number(data.total),
    statusId: data.status_id,
    status: (data.order_statuses as unknown as { name: string })?.name || "En proceso",
    paymentType: data.payment_type,
    notes: data.notes,
    proformaUrl,
    createdAt: data.created_at,
    canApprove,
  })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const guard = await requirePermission("pedidos:eliminar")
  if (!guard.ok) return guard.response!

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from("orders")
    .select("id, status_id, items")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!existing) return notFound("Pedido no encontrado")

  // Si el pedido estaba aprobado, devolver el stock a los productos.
  if (existing.status_id === 6) {
    const items = (existing.items ?? []) as Array<{ productId: string; quantity: number }>
    for (const item of items) {
      if (!item.productId) continue
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.productId)
        .is("deleted_at", null)
        .maybeSingle()

      if (product) {
        await supabase
          .from("products")
          .update({
            stock: (product.stock ?? 0) + (item.quantity ?? 0),
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.productId)
      }
    }
  }

  const { error } = await supabase
    .from("orders")
    .update({ deleted_at: new Date().toISOString(), status_id: 4 })
    .eq("id", id)

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return noContent()
}