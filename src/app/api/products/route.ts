import {
  badRequest,
  created,
  forbidden,
  ok,
  serverError,
} from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

const PRODUCT_SELECT = "id, name, description, barcode, purchase_price, price, discount_percent, category, stock, images, status_id, created_at"

interface ProductRow {
  id: string
  name: string
  description: string | null
  barcode: string | null
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
    barcode: p.barcode,
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

export async function GET() {
  const guard = await requirePermission("productos:ver")
  if (!guard.ok) return guard.response!

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) return serverError(error)

  return ok(data.map(mapProduct))
}

export async function POST(request: Request) {
  const guard = await requirePermission("productos:crear")
  if (!guard.ok) return guard.response!

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const name = (body.name as string)?.trim()
  const category = (body.category as string)?.trim()
  const price = Number(body.price)

  if (!name) return badRequest("El nombre es obligatorio")
  if (!category) return badRequest("La categoría es obligatoria")
  if (isNaN(price) || price < 0) return badRequest("El precio debe ser un número positivo")

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("products")
    .insert({
      name,
      description: (body.description as string)?.trim() || null,
      barcode: (body.barcode as string)?.trim() || null,
      purchase_price: Number(body.purchasePrice) || 0,
      price,
      discount_percent: Number(body.discountPercent) || 0,
      category,
      stock: Number(body.stock) || 0,
      images: body.images || [],
      status_id: 1,
    })
    .select(PRODUCT_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return created(mapProduct(data))
}
