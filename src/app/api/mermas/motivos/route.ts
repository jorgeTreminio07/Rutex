import { ok, serverError } from "@/lib/api-response"
import { requireAdmin } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import type { MermaMotivoDto } from "@/types/interfaces/merma.interface"

export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("merma_motivos")
    .select("id, name")
    .order("name", { ascending: true })

  if (error) return serverError(error)

  const motivos: MermaMotivoDto[] = (data ?? []).map((m) => ({ id: m.id, name: m.name }))
  return ok(motivos)
}