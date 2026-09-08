import {
  badRequest,
  created,
  forbidden,
  ok,
  serverError,
  unauthorized,
} from "@/lib/api-response"
import { getSession } from "@/lib/server/auth"
import { createClient } from "@/lib/supabase/server"

// La tienda opera en Nicaragua (UTC-6, sin horario de verano).
// Un día local va de las 06:00 UTC a las 06:00 UTC del día siguiente.
function nicaraguaDayRange(dateStr: string): { start: string; end: string } {
  const [y, m, d] = dateStr.split("-").map(Number)
  const start = new Date(Date.UTC(y, m - 1, d, 6, 0, 0))
  const end = new Date(start.getTime() + 86_400_000)
  return { start: start.toISOString(), end: end.toISOString() }
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return unauthorized()
  }

  const url = new URL(request.url)
  const statusFilter = url.searchParams.get("status")
  const dateFilter = url.searchParams.get("date")
  const search = url.searchParams.get("search")

  const supabase = await createClient()
  let query = supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, items, total, status_id, payment_type, notes, created_at, statuses!inner(name)")
    .is("deleted_at", null)

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

  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) return serverError(error)

  return ok(
    data.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      items: Array.isArray(o.items) ? o.items : [],
      total: Number(o.total),
      statusId: o.status_id,
      status: (o.statuses as unknown as { name: string })?.name || "En proceso",
      paymentType: o.payment_type,
      notes: o.notes,
      createdAt: o.created_at,
    })),
  )
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const customerName = (body.customerName as string)?.trim()
  const items = body.items as Array<{ productId: string; productName: string; price: number; quantity: number }>

  if (!customerName) return badRequest("El nombre del cliente es obligatorio")
  if (!items || items.length === 0) return badRequest("El pedido debe tener al menos un producto")

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const supabase = await createClient()

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
      items,
      total,
      status_id: 5,
      payment_type: (body.paymentType as string) || "contado",
      notes: (body.notes as string)?.trim() || null,
    })
    .select("id, order_number, customer_name, customer_phone, items, total, status_id, payment_type, notes, created_at")
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return created({
    id: data.id,
    orderNumber: data.order_number,
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    items: Array.isArray(data.items) ? data.items : [],
    total: Number(data.total),
    statusId: data.status_id,
    status: "En proceso",
    paymentType: data.payment_type,
    notes: data.notes,
    createdAt: data.created_at,
  })
}
