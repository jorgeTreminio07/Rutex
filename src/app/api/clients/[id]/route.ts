import {
  badRequest,
  forbidden,
  noContent,
  notFound,
  ok,
  serverError,
} from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { STATUSES } from "@/lib/statuses"
import type { ClientDto } from "@/types/interfaces/client.interface"

interface RouteContext {
  params: Promise<{ id: string }>
}

interface ClientRow {
  id: string
  full_name: string
  phone: string
  cedula: string | null
  address: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  status_id: number
  created_at: string
  updated_at: string | null
}

function mapClient(row: ClientRow): ClientDto {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    cedula: row.cedula,
    address: row.address,
    city: row.city,
    latitude: row.latitude != null ? Number(row.latitude) : null,
    longitude: row.longitude != null ? Number(row.longitude) : null,
    statusId: row.status_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const CLIENT_SELECT =
  "id, full_name, phone, cedula, address, city, latitude, longitude, status_id, created_at, updated_at"

// Cédula sin guiones: elimina guiones (-) y espacios.
function sanitizeCedula(value: unknown): string | null {
  const s = typeof value === "string" ? value.trim() : ""
  if (!s) return null
  return s.replace(/[-\s]/g, "")
}

function optionalText(value: unknown): string | null {
  const s = typeof value === "string" ? value.trim() : ""
  return s ? s : null
}

function parseCoords(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export async function GET(_request: Request, { params }: RouteContext) {
  const guard = await requirePermission("clientes:ver")
  if (!guard.ok) return guard.response!

  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .select(CLIENT_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) return serverError(error)
  if (!data) return notFound("Cliente no encontrado")

  return ok(mapClient(data))
}

export async function PUT(request: Request, { params }: RouteContext) {
  const guard = await requirePermission("clientes:editar")
  if (!guard.ok) return guard.response!

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : ""
  const phone = typeof body.phone === "string" ? body.phone.trim() : ""

  if (!fullName) return badRequest("El nombre del cliente es obligatorio")
  if (!phone) return badRequest("El teléfono es obligatorio")

  const latitude = parseCoords(body.latitude)
  const longitude = parseCoords(body.longitude)
  if ((latitude === null) !== (longitude === null)) {
    return badRequest("Ingresa ambas coordenadas (latitud y longitud)")
  }

  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("id", id)
    .maybeSingle()

  if (!existing) return notFound("Cliente no encontrado")

  const { data, error } = await supabase
    .from("clients")
    .update({
      full_name: fullName,
      phone,
      cedula: sanitizeCedula(body.cedula),
      address: optionalText(body.address),
      city: optionalText(body.city),
      latitude,
      longitude,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(CLIENT_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return ok(mapClient(data))
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const guard = await requirePermission("clientes:eliminar")
  if (!guard.ok) return guard.response!

  const { id } = await params

  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from("clients")
    .select("id, status_id")
    .eq("id", id)
    .maybeSingle()

  if (!existing) return notFound("Cliente no encontrado")

  const { error } = await supabase
    .from("clients")
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