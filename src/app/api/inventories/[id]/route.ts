import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
} from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  applyStockDeltas,
  computeInventoryValue,
  inventoryItemToRow,
  parseInventoryItems,
} from "@/app/api/inventories/helpers"
import type { InventoryItemDto, InventoryDto } from "@/types/interfaces/inventory.interface"

interface RouteContext {
  params: Promise<{ id: string }>
}

interface InventoryRow {
  id: string
  inventory_number: string
  items: InventoryItemDto[] | null
  total_value: number | null
  created_at: string
  updated_at: string | null
}

function mapInventory(row: InventoryRow): InventoryDto {
  const items = Array.isArray(row.items) ? row.items : []
  return {
    id: row.id,
    inventoryNumber: row.inventory_number,
    items,
    totalUnits: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    totalValue: Number(row.total_value) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const INVENTORY_SELECT = "id, inventory_number, items, total_value, created_at, updated_at"

export async function GET(_request: Request, { params }: RouteContext) {
  const guard = await requirePermission("inventarios:ver")
  if (!guard.ok) return guard.response!

  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("inventories")
    .select(INVENTORY_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) return serverError(error)
  if (!data) return notFound("Inventario no encontrado")

  return ok(mapInventory(data))
}

export async function PUT(request: Request, { params }: RouteContext) {
  const guard = await requirePermission("inventarios:editar")
  if (!guard.ok) return guard.response!

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const items = parseInventoryItems(body.items, true)
  if (!items) return badRequest("El inventario debe incluir al menos un producto con cantidad mayor a 0")

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from("inventories")
    .select("id, inventory_number, items")
    .eq("id", id)
    .maybeSingle()

  if (!existing) return notFound("Inventario no encontrado")

  const oldItems = Array.isArray(existing.items) ? (existing.items as InventoryItemDto[]) : []
  const oldQuantityById = new Map(oldItems.map((item) => [item.productId, Number(item.quantity) || 0]))

  const productIds = [...new Set(items.map((item) => item.productId))]
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price")
    .in("id", productIds)

  const nameById = new Map((products ?? []).map((p) => [p.id, p.name]))
  const rows = items.map((item) => inventoryItemToRow(item, nameById.get(item.productId) ?? item.productName ?? "Producto"))

  const totalValue = computeInventoryValue(products ?? [], items)

  // delta = nueva cantidad - cantidad anterior (0 si no estaba en el inventario)
  const deltas: Record<string, number> = {}
  for (const item of items) {
    deltas[item.productId] = item.quantity - (oldQuantityById.get(item.productId) ?? 0)
  }
  for (const [productId, oldQuantity] of oldQuantityById) {
    if (deltas[productId] === undefined) {
      deltas[productId] = 0 - oldQuantity
    }
  }

  const { data, error } = await supabase
    .from("inventories")
    .update({
      items: rows,
      total_value: totalValue,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(INVENTORY_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  await applyStockDeltas(supabase, deltas)

  return ok(mapInventory(data))
}