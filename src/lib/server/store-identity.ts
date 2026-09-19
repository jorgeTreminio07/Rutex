import { getAssetUrl } from "@/lib/assets"
import { createAdminClient } from "@/lib/supabase/admin"

const STORE_ROW_ID = "00000000-0000-0000-0000-000000000001"

// Identidad pública de la tienda (nombre + logo) para título de pestaña,
// favicon y pantalla de login. Cualquier fallo devuelve los valores por
// defecto (Rutex + sin logo) sin romper el render.
export async function getPublicStoreIdentity(): Promise<{
  name: string
  logoUrl: string | null
}> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("store_profile")
      .select("name, logo_url")
      .eq("id", STORE_ROW_ID)
      .maybeSingle()
    const name = data?.name?.trim() ? data.name.trim() : "Rutex"
    return { name, logoUrl: getAssetUrl(data?.logo_url ?? null) }
  } catch {
    return { name: "Rutex", logoUrl: null }
  }
}