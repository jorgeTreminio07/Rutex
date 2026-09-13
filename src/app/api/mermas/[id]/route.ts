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
  computeMermaValue,
  mermaItemToRow,
  parseMermaItems,
  validateStock,
} from "@/app/api/mermas/helpers"
import type { MermaItemDto, MermaDto } from "@/types/interfaces/merma.interface"

interface RouteContext {
  params: Promise<{ id: string }>
}

interface MermaRow {
  id: string
  merma_number: string
  motivo_id: number
  items: MermaItemDto[] | null
  total_value: number | null
  observation: string | null
  created_at: string
  updated_at: string | null
  merma_motivos: unknown
}

function mapMerma(row: MermaRow): MermaDto {
  const items = Array.isArray(row.items) ? row.items : []
  const motivo = row.merma_motivos as unknown as { name: string } | null
  return {
    id: row.id,
    mermaNumber: row.merma_number,
    motivoId: row.motivo_id,
    motivoName: motivo?.name ?? "—",
    items,
    totalUnits: items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    totalValue: Number(row.total_value) || 0,
    observation: row.observation ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const MERMA_SELECT =
  "id, merma_number, motivo_id, items, total_value, observation, created_at, updated_at, merma_motivos!inner(name)"

export async function GET(_request: Request, { params }: RouteContext) {
  const guard = await requirePermission("mermas:ver")
  if (!guard.ok) return guard.response!

  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("mermas")
    .select(MERMA_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) return serverError(error)
  if (!data) return notFound("Merma no encontrada")

  return ok(mapMerma(data))
}

export async function PUT(request: Request, { params }: RouteContext) {
  const guard = await requirePermission("mermas:editar")
  if (!guard.ok) return guard.response!

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const motivoId = Number(body.motivoId)
  if (!Number.isInteger(motivoId) || motivoId <= 0) {
    return badRequest("Debes seleccionar un motivo de merma")
  }

  const items = parseMermaItems(body.items, true)
  if (!items) return badRequest("La merma debe incluir al menos un producto con cantidad mayor a 0")

  const observation =
    typeof body.observation === "string" && body.observation.trim() !== ""
      ? body.observation.trim()
      : null

  const supabase = createAdminClient()

  const { data: motivo } = await supabase
    .from("merma_motivos")
    .select("id")
    .eq("id", motivoId)
    .maybeSingle()

  if (!motivo) return notFound("Motivo de merma no encontrado")

  const { data: existing } = await supabase
    .from("mermas")
    .select("id, items")
    .eq("id", id)
    .maybeSingle()

  if (!existing) return notFound("Merma no encontrada")

  const oldItems = Array.isArray(existing.items) ? (existing.items as MermaItemDto[]) : []
  const oldQuantityById = new Map(oldItems.map((item) => [item.productId, Number(item.quantity) || 0]))

  const productIds = [...new Set(items.map((item) => item.productId))]
  const { data: products } = await supabase
    .from("products")
    .select("id, name, purchase_price, price, stock")
    .in("id", productIds)

  // El stock actual ya tiene descontada la merma: se le suma lo restado
  // (oldQuantityById) para saber cuánto se puede dar de baja ahora.
  const stockCheck = validateStock(products ?? [], items, oldQuantityById)
  if (!stockCheck.ok) return badRequest(stockCheck.message)

  const productById = new Map(
    (products ?? []).map((p) => [
      p.id,
      { name: p.name, purchasePrice: Number(p.purchase_price) || 0, sellPrice: Number(p.price) || 0 },
    ]),
  )

  const rows = items.map((item) => {
    const data = productById.get(item.productId) ?? {
      name: item.productName ?? "Producto",
      purchasePrice: 0,
      sellPrice: 0,
    }
    return mermaItemToRow(item, data.name, data.purchasePrice, data.sellPrice)
  })

  const totalValue = computeMermaValue((products ?? []) as Array<{ id: string; price?: number | string | null }>, items)

  // Ajuste de stock = cantidad anterior - cantidad nueva (0 si no estaba
  // antes). Bajar la merma devuelve stock (delta positivo); subirla lo
  // resta (delta negativo). Productos que ya no están: se devuelve todo.
  const deltas: Record<string, number> = {}
  for (const item of items) {
    deltas[item.productId] = (deltas[item.productId] ?? 0) - item.quantity
  }
  for (const [productId, oldQuantity] of oldQuantityById) {
    deltas[productId] = (deltas[productId] ?? 0) + oldQuantity
  }

  const { data, error } = await supabase
    .from("mermas")
    .update({
      motivo_id: motivoId,
      items: rows,
      total_value: totalValue,
      observation,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(MERMA_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  await applyStockDeltas(supabase, deltas)

  return ok(mapMerma(data))
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const guard = await requirePermission("mermas:eliminar")
  if (!guard.ok) return guard.response!

  const { id } = await params

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from("mermas")
    .select("id, items")
    .eq("id", id)
    .maybeSingle()

  if (!existing) return notFound("Merma no encontrada")

  // Al eliminar la merma se revierte lo restado: el stock vuelve a subir.
  const deltas: Record<string, number> = {}
  const oldItems = Array.isArray(existing.items) ? (existing.items as MermaItemDto[]) : []
  for (const item of oldItems) {
    const quantity = Number(item.quantity) || 0
    if (quantity > 0) deltas[item.productId] = (deltas[item.productId] ?? 0) + quantity
  }

  const { error } = await supabase.from("mermas").delete().eq("id", id)

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  await applyStockDeltas(supabase, deltas)

  return ok({ deleted: true })
}