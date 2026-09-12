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
import { removeFromStorage } from "@/lib/server/storage"
import { getAssetUrl } from "@/lib/assets"
import type { GastoDto } from "@/types/interfaces/gasto.interface"

interface RouteContext {
  params: Promise<{ id: string }>
}

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

export async function GET(_request: Request, { params }: RouteContext) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("gastos")
    .select(GASTO_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) return serverError(error)
  if (!data) return notFound("Gasto no encontrado")

  return ok(mapGasto(data))
}

export async function PUT(request: Request, { params }: RouteContext) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const title = typeof body.title === "string" ? body.title.trim() : ""
  const amount = body.amount === undefined ? undefined : Number(body.amount)
  const hasReceiptKey = "receiptPath" in body
  const newReceiptPath =
    typeof body.receiptPath === "string" && body.receiptPath.trim() !== ""
      ? body.receiptPath.trim()
      : null

  if (title === "") return badRequest("El título del gasto es obligatorio")
  if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
    return badRequest("El monto debe ser un número mayor o igual a 0")
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("gastos")
    .select("id, receipt_path")
    .eq("id", id)
    .maybeSingle()

  if (!existing) return notFound("Gasto no encontrado")

  const oldReceiptPath = existing.receipt_path ?? null

  const updates: Record<string, unknown> = {
    title,
    observation: optionalText(body.observation),
    updated_at: new Date().toISOString(),
  }
  if (amount !== undefined) updates.amount = amount
  if (hasReceiptKey) updates.receipt_path = newReceiptPath

  const { data, error } = await supabase
    .from("gastos")
    .update(updates)
    .eq("id", id)
    .select(GASTO_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  // Si el recibo cambió (o se quitó), se elimina el archivo anterior del storage.
  if (hasReceiptKey && oldReceiptPath && oldReceiptPath !== newReceiptPath) {
    await removeFromStorage(oldReceiptPath)
  }

  return ok(mapGasto(data))
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const { id } = await params

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("gastos")
    .select("id, receipt_path")
    .eq("id", id)
    .maybeSingle()

  if (!existing) return notFound("Gasto no encontrado")

  const { error } = await supabase.from("gastos").delete().eq("id", id)

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  if (existing.receipt_path) {
    await removeFromStorage(existing.receipt_path)
  }

  return noContent()
}