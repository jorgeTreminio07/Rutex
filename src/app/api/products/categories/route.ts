import { ok, serverError } from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import { fetchAllRows } from "@/app/api/pagination"

export async function GET() {
  const guard = await requirePermission("productos:ver")
  if (!guard.ok) return guard.response!

  const supabase = await createClient()
  const rows = await fetchAllRows<{ category: string }>((from, to) =>
    supabase
      .from("products")
      .select("category")
      .is("deleted_at", null)
      .range(from, to),
  )
  if (!rows.data) return serverError(rows.error)

  const categories = [
    ...new Set(
      rows.data
        .map((p) => (p.category ?? "").trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, "es"))

  return ok(categories)
}