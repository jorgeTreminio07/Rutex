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

const PRODUCT_SELECT = "id, name, description, purchase_price, price, discount_percent, category, stock, images, status_id, created_at"

interface ProductRow {
  id: string
  name: string
  description: string | null
  purchase_price: number
  price: number
  discount_percent: number
  category: string
  stock: number
  images: string[] | null
  status_id: number
  created_at: string
}

function mapProduct(p: ProductRow) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    purchasePrice: Number(p.purchase_price ?? 0),
    price: Number(p.price),
    discountPercent: Number(p.discount_percent),
    category: p.category,
    stock: p.stock,
    images: Array.isArray(p.images) ? p.images : [],
    statusId: p.status_id,
    createdAt: p.created_at,
  }
}

export async function GET(_request: Request, { params }: RouteContext) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle()

  if (error) return serverError(error)
  if (!data) return notFound("Producto no encontrado")

  return ok(mapProduct(data))
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

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!existing) return notFound("Producto no encontrado")

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) updates.name = (body.name as string).trim()
  if (body.description !== undefined) updates.description = (body.description as string)?.trim() || null
  if (body.purchasePrice !== undefined) updates.purchase_price = Number(body.purchasePrice)
  if (body.price !== undefined) updates.price = Number(body.price)
  if (body.discountPercent !== undefined) updates.discount_percent = Number(body.discountPercent)
  if (body.category !== undefined) updates.category = (body.category as string).trim()
  if (body.stock !== undefined) updates.stock = Number(body.stock)
  if (body.images !== undefined) updates.images = body.images

  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select(PRODUCT_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return ok(mapProduct(data))
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle()

  if (!existing) return notFound("Producto no encontrado")

  const { error } = await supabase
    .from("products")
    .update({ deleted_at: new Date().toISOString(), status_id: 4 })
    .eq("id", id)

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return noContent()
}
