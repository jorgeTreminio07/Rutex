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
import { STATUSES } from "@/lib/statuses"
import type { SupplierDto } from "@/types/interfaces/supplier.interface"

interface RouteContext {
  params: Promise<{ id: string }>
}

interface SupplierRow {
  id: string
  name: string
  ruc: string
  phone: string
  address: string | null
  owner_name: string | null
  email: string | null
  status_id: number
  created_at: string
  updated_at: string | null
}

function mapSupplier(row: SupplierRow): SupplierDto {
  return {
    id: row.id,
    name: row.name,
    ruc: row.ruc,
    phone: row.phone,
    address: row.address,
    ownerName: row.owner_name,
    email: row.email,
    statusId: row.status_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const SUPPLIER_SELECT =
  "id, name, ruc, phone, address, owner_name, email, status_id, created_at, updated_at"

function optionalText(value: unknown): string | null {
  const s = typeof value === "string" ? value.trim() : ""
  return s ? s : null
}

function requiredText(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function validateEmail(value: string | null): string | null {
  if (!value) return null
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(value) ? null : "El correo electrónico no es válido"
}

export async function GET(_request: Request, { params }: RouteContext) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("suppliers")
    .select(SUPPLIER_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) return serverError(error)
  if (!data) return notFound("Proveedor no encontrado")

  return ok(mapSupplier(data))
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

  const name = requiredText(body.name)
  const ruc = requiredText(body.ruc)
  const phone = requiredText(body.phone)
  const email = optionalText(body.email)

  if (!name) return badRequest("El nombre del proveedor es obligatorio")
  if (!ruc) return badRequest("El RUC es obligatorio")
  if (!phone) return badRequest("El teléfono es obligatorio")

  const emailError = validateEmail(email)
  if (emailError) return badRequest(emailError)

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("suppliers")
    .select("id")
    .eq("id", id)
    .maybeSingle()

  if (!existing) return notFound("Proveedor no encontrado")

  const { data, error } = await supabase
    .from("suppliers")
    .update({
      name,
      ruc,
      phone,
      address: optionalText(body.address),
      owner_name: optionalText(body.ownerName),
      email,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(SUPPLIER_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return ok(mapSupplier(data))
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const { id } = await params

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("suppliers")
    .select("id, status_id")
    .eq("id", id)
    .maybeSingle()

  if (!existing) return notFound("Proveedor no encontrado")

  const { error } = await supabase
    .from("suppliers")
    .update({
      status_id: STATUSES.DELETED,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return noContent()
}