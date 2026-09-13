import {
  badRequest,
  created,
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
import { nicaraguaDayRange } from "@/app/api/reports/helpers"
import { fetchAllRows, isPaging, paginated, parsePagination } from "@/app/api/pagination"
import type { MermaItemDto, MermaDto } from "@/types/interfaces/merma.interface"

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

export async function GET(request: Request) {
  const guard = await requirePermission("mermas:ver")
  if (!guard.ok) return guard.response!

  const url = new URL(request.url)
  const search = url.searchParams.get("search")?.trim() || undefined
  const dateFilter = url.searchParams.get("date")
  const paging = parsePagination(url)

  const supabase = await createClient()

  // La búsqueda matchea número de merma o nombre del motivo. El catálogo de motivos
  // es pequeño: se pre-consulta y se reduce a un `motivo_id.in.(...)`.
  let motivoIds: number[] = []
  if (search) {
    const { data: motivos } = await supabase
      .from("merma_motivos")
      .select("id")
      .ilike("name", `%${search}%`)
    if (motivos && motivos.length > 0) {
      motivoIds = motivos.map((m) => m.id)
    }
  }

  const buildQuery = () => {
    let query = supabase.from("mermas").select(MERMA_SELECT, { count: "exact" })
    if (dateFilter) {
      const { start, end } = nicaraguaDayRange(dateFilter)
      query = query.gte("created_at", start).lt("created_at", end)
    }
    if (search) {
      const conditions = [`merma_number.ilike.%${search}%`]
      if (motivoIds.length > 0) conditions.push(`motivo_id.in.(${motivoIds.join(",")})`)
      query = query.or(conditions.join(","))
    }
    return query.order("created_at", { ascending: false })
  }

  if (isPaging(url)) {
    const { data, count, error } = await buildQuery().range(paging.from, paging.to)
    if (error) return serverError(error)
    return ok(paginated((data ?? []).map(mapMerma), count ?? 0, paging.page, paging.pageSize))
  }

  const rows = await fetchAllRows<MermaRow>((from, to) => buildQuery().range(from, to))
  if (!rows.data) return serverError(rows.error)
  return ok(rows.data.map(mapMerma))
}

export async function POST(request: Request) {
  const guard = await requirePermission("mermas:crear")
  if (!guard.ok) return guard.response!

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

  const items = parseMermaItems(body.items)
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

  const { data: nextNumber, error: seqError } = await supabase.rpc("next_merma_number")
  if (seqError || typeof nextNumber !== "string") {
    if (seqError?.code === "42501") return forbidden()
    return serverError(seqError ?? new Error("No se pudo generar el número de merma"))
  }

  const productIds = [...new Set(items.map((item) => item.productId))]
  const { data: products } = await supabase
    .from("products")
    .select("id, name, purchase_price, price, stock")
    .in("id", productIds)

  const stockCheck = validateStock(products ?? [], items)
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

  // La merma RESTA del stock: deltas negativos.
  const deltas: Record<string, number> = {}
  for (const item of items) {
    deltas[item.productId] = (deltas[item.productId] ?? 0) - item.quantity
  }

  const { data, error } = await supabase
    .from("mermas")
    .insert({
      merma_number: nextNumber,
      motivo_id: motivoId,
      items: rows,
      total_value: totalValue,
      observation,
    })
    .select(MERMA_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  await applyStockDeltas(supabase, deltas)

  return created(mapMerma(data))
}