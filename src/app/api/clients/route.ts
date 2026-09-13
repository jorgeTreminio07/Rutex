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
import { STATUSES } from "@/lib/statuses"
import { fetchAllRows, isPaging, paginated, parsePagination } from "@/app/api/pagination"
import type { ClientDto } from "@/types/interfaces/client.interface"

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

function validateLocation(
  latitude: number | null,
  longitude: number | null,
): string | null {
  if ((latitude === null) !== (longitude === null)) {
    return "Ingresa ambas coordenadas (latitud y longitud)"
  }
  if (latitude !== null && (latitude < -90 || latitude > 90)) {
    return "La latitud está fuera de rango"
  }
  if (longitude !== null && (longitude < -180 || longitude > 180)) {
    return "La longitud está fuera de rango"
  }
  return null
}

export async function GET(request: Request) {
  const guard = await requirePermission("clientes:ver")
  if (!guard.ok) return guard.response!

  const url = new URL(request.url)
  const search = url.searchParams.get("search")?.trim() || undefined
  const paging = parsePagination(url)

  const supabase = await createClient()

  const buildQuery = () => {
    let query = supabase
      .from("clients")
      .select(CLIENT_SELECT, { count: "exact" })
      .neq("status_id", STATUSES.DELETED)
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,cedula.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    return query.order("full_name", { ascending: true })
  }

  if (isPaging(url)) {
    const { data, count, error } = await buildQuery().range(paging.from, paging.to)
    if (error) return serverError(error)
    return ok(paginated((data ?? []).map(mapClient), count ?? 0, paging.page, paging.pageSize))
  }

  const rows = await fetchAllRows<ClientRow>((from, to) => buildQuery().range(from, to))
  if (!rows.data) return serverError(rows.error)
  return ok(rows.data.map(mapClient))
}

export async function POST(request: Request) {
  const guard = await requirePermission("clientes:crear")
  if (!guard.ok) return guard.response!

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
  const locationError = validateLocation(latitude, longitude)
  if (locationError) return badRequest(locationError)

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("clients")
    .insert({
      full_name: fullName,
      phone,
      cedula: sanitizeCedula(body.cedula),
      address: optionalText(body.address),
      city: optionalText(body.city),
      latitude,
      longitude,
    })
    .select(CLIENT_SELECT)
    .single()

  if (error) {
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return created(mapClient(data))
}