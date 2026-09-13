import { badRequest, conflict, created, forbidden, ok, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const guard = await requirePermission("configuracion:ver")
  if (!guard.ok) return guard.response!

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("cities")
    .select("id, name, created_at")
    .order("id", { ascending: true })

  if (error) return serverError(error)

  return ok(
    (data ?? []).map((city) => ({
      id: city.id,
      name: city.name,
      createdAt: city.created_at,
    })),
  )
}

export async function POST(request: Request) {
  const guard = await requirePermission("configuracion:editar")
  if (!guard.ok) return guard.response!

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return badRequest("Cuerpo inválido")
  }

  const name = String(body.name ?? "").trim()
  if (!name) return badRequest("El nombre de la ciudad es obligatorio")

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("cities")
    .insert({ name })
    .select("id, name, created_at")
    .single()

  if (error) {
    if (error.code === "23505") return conflict("Esa ciudad ya existe")
    if (error.code === "42501") return forbidden()
    return serverError(error)
  }

  return created({
    id: data.id,
    name: data.name,
    createdAt: data.created_at,
  })
}