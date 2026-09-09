import {
  ok,
  serverError,
  unauthorized,
} from "@/lib/api-response"
import { getSession } from "@/lib/server/auth"
import { createClient } from "@/lib/supabase/server"
import { DELIVERY_SELECT, mapDelivery } from "@/app/api/deliveries/helpers"

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("deliveries")
    .select(DELIVERY_SELECT)
    .order("entered_at", { ascending: false })

  if (error) return serverError(error)

  return ok((data ?? []).map(mapDelivery))
}