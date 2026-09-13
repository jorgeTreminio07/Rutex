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
import {
  applyStockDeltas,
  computeInventoryValue,
  inventoryItemToRow,
  parseInventoryItems,
} from "@/app/api/inventories/helpers"
import type { InventoryItemDto, InventoryDto } from "@/types/interfaces/inventory.interface"

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

export async function GET() {
  const guard = await requirePermission("inventarios:ver")
  if (!guard.ok) return guard.response!

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("inventories")
    .select(INVENTORY_SELECT)
    .order("created_at", { ascending: false })

  if (error) return serverError(error)

  return ok((data ?? []).map(mapInventory))
}

export async function POST(request: Request) {
  const guard = await requirePermission("inventarios:crear")
  if (!guard.ok) return guard.response!

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const items = parseInventoryItems(body.items)
  if (!items) return badRequest("El inventario debe incluir al menos un producto con cantidad mayor a 0")

  const supabase = createAdminClient()

  const { data: nextNumber, error: seqError } = await supabase.rpc("next_inventory_number")
  if (seqError || typeof nextNumber !== "string") {
    if (seqError?.code === "42501") return forbidden()
    return serverError(seqError ?? new Error("No se pudo generar el número de inventario"))
  }

  const productIds = [...new Set(items.map((item) => item.productId))]
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price")
    .in("id", productIds)

  const nameById = new Map((products ?? []).map((p) => [p.id, p.name]))
  const rows = items.map((item) => inventoryItemToRow(item, nameById.get(item.productId) ?? item.productName ?? "Producto"))

  const totalValue = computeInventoryValue(products ?? [], items)

  const deltas: Record<string, number> = {}
  for (const item of items) {
    deltas[item.productId] = (deltas[item.productId] ?? 0) + item.quantity
  }

  const { data, error } = await supabase
    .from("inventories")
    .insert({
      inventory_number: nextNumber,
      items: rows,
      total_value: totalValue,
    })
    .select(INVENTORY_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  await applyStockDeltas(supabase, deltas)

  return created(mapInventory(data))
}