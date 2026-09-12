import {
  badRequest,
  created,
  forbidden,
  ok,
  serverError,
} from "@/lib/api-response"
import { requireAdmin } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import { getAssetUrl } from "@/lib/assets"
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

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("gastos")
    .select(GASTO_SELECT)
    .order("created_at", { ascending: false })

  if (error) return serverError(error)

  return ok((data ?? []).map(mapGasto))
}

export async function POST(request: Request) {
  const guard = await requireAdmin()
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

  const supabase = await createClient()
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