import {
  ok,
  serverError,
} from "@/lib/api-response"
import { requirePermission } from "@/lib/server/guards"
import { createClient } from "@/lib/supabase/server"
import { DELIVERY_SELECT, mapDelivery } from "@/app/api/deliveries/helpers"

export async function GET() {
  const guard = await requirePermission("almacen:ver")
  if (!guard.ok) return guard.response!

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("deliveries")
    .select(DELIVERY_SELECT)
    .order("entered_at", { ascending: false })

  if (error) return serverError(error)

  return ok((data ?? []).map(mapDelivery))
}