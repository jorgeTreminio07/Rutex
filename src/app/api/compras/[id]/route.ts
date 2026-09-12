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
import { optionalText, resolveSupplierName } from "@/app/api/compras/helpers"
import type { CompraDto } from "@/types/interfaces/compra.interface"

interface RouteContext {
  params: Promise<{ id: string }>
}

interface CompraRow {
  id: string
  title: string
  supplier_id: string | null
  supplier_name: string | null
  observation: string | null
  amount: number | string | null
  receipt_path: string | null
  created_at: string
  updated_at: string | null
}

function mapCompra(row: CompraRow): CompraDto {
  return {
    id: row.id,
    title: row.title,
    supplierId: row.supplier_id,
    supplierName: row.supplier_name,
    observation: row.observation,
    amount: Number(row.amount) || 0,
    receiptPath: row.receipt_path,
    receiptUrl: getAssetUrl(row.receipt_path),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const COMPRA_SELECT =
  "id, title, supplier_id, supplier_name, observation, amount, receipt_path, created_at, updated_at"

export async function GET(_request: Request, { params }: RouteContext) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("compras")
    .select(COMPRA_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) return serverError(error)
  if (!data) return notFound("Compra no encontrada")

  return ok(mapCompra(data))
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
  const supplierId =
    typeof body.supplierId === "string" && body.supplierId.trim() !== ""
      ? body.supplierId.trim()
      : null
  const amount = body.amount === undefined ? undefined : Number(body.amount)
  const hasReceiptKey = "receiptPath" in body
  const newReceiptPath =
    typeof body.receiptPath === "string" && body.receiptPath.trim() !== ""
      ? body.receiptPath.trim()
      : null

  if (title === "") return badRequest("El título de la compra es obligatorio")
  if (!supplierId) return badRequest("Selecciona un proveedor")
  if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
    return badRequest("El monto debe ser un número mayor o igual a 0")
  }

  const supabase = await createClient()

  const supplierName = await resolveSupplierName(supabase, supplierId)
  if (!supplierName) return badRequest("El proveedor seleccionado no existe o fue eliminado")

  const { data: existing } = await supabase
    .from("compras")
    .select("id, receipt_path")
    .eq("id", id)
    .maybeSingle()

  if (!existing) return notFound("Compra no encontrada")

  const oldReceiptPath = existing.receipt_path ?? null

  const updates: Record<string, unknown> = {
    title,
    supplier_id: supplierId,
    supplier_name: supplierName,
    observation: optionalText(body.observation),
    updated_at: new Date().toISOString(),
  }
  if (amount !== undefined) updates.amount = amount
  if (hasReceiptKey) updates.receipt_path = newReceiptPath

  const { data, error } = await supabase
    .from("compras")
    .update(updates)
    .eq("id", id)
    .select(COMPRA_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  // Si el recibo cambió (o se quitó), se elimina el archivo anterior del storage.
  if (hasReceiptKey && oldReceiptPath && oldReceiptPath !== newReceiptPath) {
    await removeFromStorage(oldReceiptPath)
  }

  return ok(mapCompra(data))
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const { id } = await params

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("compras")
    .select("id, receipt_path")
    .eq("id", id)
    .maybeSingle()

  if (!existing) return notFound("Compra no encontrada")

  const { error } = await supabase.from("compras").delete().eq("id", id)

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  if (existing.receipt_path) {
    await removeFromStorage(existing.receipt_path)
  }

  return noContent()
}