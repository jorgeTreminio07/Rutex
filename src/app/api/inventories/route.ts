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
import { nicaraguaDayRange } from "@/app/api/reports/helpers"
import { fetchAllRows, isPaging, paginated, parsePagination } from "@/app/api/pagination"
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

export async function GET(request: Request) {
  const guard = await requirePermission("inventarios:ver")
  if (!guard.ok) return guard.response!

  const url = new URL(request.url)
  const search = url.searchParams.get("search")?.trim() || undefined
  const dateFilter = url.searchParams.get("date")
  const paging = parsePagination(url)

  const supabase = await createClient()

  const buildQuery = () => {
    let query = supabase.from("inventories").select(INVENTORY_SELECT, { count: "exact" })
    if (search) query = query.ilike("inventory_number", `%${search}%`)
    if (dateFilter) {
      const { start, end } = nicaraguaDayRange(dateFilter)
      query = query.gte("created_at", start).lt("created_at", end)
    }
    return query.order("created_at", { ascending: false })
  }

  if (isPaging(url)) {
    const { data, count, error } = await buildQuery().range(paging.from, paging.to)
    if (error) return serverError(error)
    return ok(paginated((data ?? []).map(mapInventory), count ?? 0, paging.page, paging.pageSize))
  }

  const rows = await fetchAllRows<InventoryRow>((from, to) => buildQuery().range(from, to))
  if (!rows.data) return serverError(rows.error)
  return ok(rows.data.map(mapInventory))
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