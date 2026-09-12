import type { SupabaseClient } from "@supabase/supabase-js"

export function optionalText(value: unknown): string | null {
  const s = typeof value === "string" ? value.trim() : ""
  return s ? s : null
}

export async function resolveSupplierName(
  supabase: SupabaseClient,
  supplierId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("suppliers")
    .select("name")
    .eq("id", supplierId)
    .neq("status_id", 4)
    .maybeSingle()
  return data?.name ?? null
}