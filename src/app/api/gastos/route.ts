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
import { getAssetUrl } from "@/lib/assets"
import { nicaraguaDayRange } from "@/app/api/reports/helpers"
import { fetchAllRows, isPaging, paginated, parsePagination } from "@/app/api/pagination"
import type { GastoDto } from "@/types/interfaces/gasto.interface"

interface GastoRow {
  id: string
  title: string
  observation: string | null
  amount: number | string | null
  receipt_path: string | null
  created_at: string
  updated_at: string | null
}

function mapGasto(row: GastoRow): GastoDto {
  return {
    id: row.id,
    title: row.title,
    observation: row.observation,
    amount: Number(row.amount) || 0,
    receiptPath: row.receipt_path,
    receiptUrl: getAssetUrl(row.receipt_path),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const GASTO_SELECT = "id, title, observation, amount, receipt_path, created_at, updated_at"

function optionalText(value: unknown): string | null {
  const s = typeof value === "string" ? value.trim() : ""
  return s ? s : null
}

export async function GET(request: Request) {
  const guard = await requirePermission("gastos:ver")
  if (!guard.ok) return guard.response!

  const url = new URL(request.url)
  const search = url.searchParams.get("search")?.trim() || undefined
  const dateFilter = url.searchParams.get("date")
  const paging = parsePagination(url)

  const supabase = await createClient()

  const buildQuery = () => {
    let query = supabase.from("gastos").select(GASTO_SELECT, { count: "exact" })
    if (search) query = query.or(`title.ilike.%${search}%,observation.ilike.%${search}%`)
    if (dateFilter) {
      const { start, end } = nicaraguaDayRange(dateFilter)
      query = query.gte("created_at", start).lt("created_at", end)
    }
    return query.order("created_at", { ascending: false })
  }

  if (isPaging(url)) {
    const { data, count, error } = await buildQuery().range(paging.from, paging.to)
    if (error) return serverError(error)
    return ok(paginated((data ?? []).map(mapGasto), count ?? 0, paging.page, paging.pageSize))
  }

  const rows = await fetchAllRows<GastoRow>((from, to) => buildQuery().range(from, to))
  if (!rows.data) return serverError(rows.error)
  return ok(rows.data.map(mapGasto))
}

export async function POST(request: Request) {
  const guard = await requirePermission("gastos:crear")
  if (!guard.ok) return guard.response!

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const title = typeof body.title === "string" ? body.title.trim() : ""
  const amount = Number(body.amount)
  const receiptPath =
    typeof body.receiptPath === "string" && body.receiptPath.trim() !== ""
      ? body.receiptPath.trim()
      : null

  if (!title) return badRequest("El título del gasto es obligatorio")
  if (!Number.isFinite(amount) || amount < 0) {
    return badRequest("El monto debe ser un número mayor o igual a 0")
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("gastos")
    .insert({
      title,
      observation: optionalText(body.observation),
      amount,
      receipt_path: receiptPath,
    })
    .select(GASTO_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return created(mapGasto(data))
}