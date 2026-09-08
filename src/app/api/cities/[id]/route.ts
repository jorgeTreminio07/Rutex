import { noContent, notFound, serverError } from "@/lib/api-response"
import { requireAdmin } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"

interface Context {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, { params }: Context) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const { id } = await params
  const cityId = Number(id)
  if (!Number.isInteger(cityId)) return notFound("Ciudad no encontrada")

  const supabase = await createClient()

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