import { noContent, notFound, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createAdminClient } from "@/lib/supabase/admin"

interface Context {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, { params }: Context) {
  const guard = await requirePermission("configuracion:editar")
  if (!guard.ok) return guard.response!

  const { id } = await params
  const cityId = Number(id)
  if (!Number.isInteger(cityId)) return notFound("Ciudad no encontrada")

  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from("cities")
    .select("id")
    .eq("id", cityId)
    .maybeSingle()

  if (!existing) return notFound("Ciudad no encontrada")

  const { error } = await supabase.from("cities").delete().eq("id", cityId)

  if (error) return serverError(error)

  return noContent()
}