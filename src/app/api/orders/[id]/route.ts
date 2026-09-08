import {
  badRequest,
  forbidden,
  noContent,
  notFound,
  ok,
  serverError,
} from "@/lib/api-response"
import { requireAdmin } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, { params }: RouteContext) {
  const { id } = await params
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const statusId = Number(body.statusId)
  if (![5, 6, 7].includes(statusId)) return badRequest("Estado inválido")

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("orders")
    .select("id, status_id, items")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!existing) return notFound("Pedido no encontrado")

  // Al aprobar, descontar stock de los productos incluidos.
  if (statusId === 6 && existing.status_id === 5) {
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
            stock: Math.max(0, (product.stock ?? 0) - (item.quantity ?? 0)),
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.productId)
      }
    }
  }

  const { data, error } = await supabase
    .from("orders")
    .update({
      status_id: statusId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, order_number, customer_name, customer_phone, items, total, status_id, payment_type, notes, created_at, order_statuses!inner(name)")
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
    items: Array.isArray(data.items) ? data.items : [],
    total: Number(data.total),
    statusId: data.status_id,
    status: (data.order_statuses as unknown as { name: string })?.name || "En proceso",
    paymentType: data.payment_type,
    notes: data.notes,
    createdAt: data.created_at,
  })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const supabase = await createClient()

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