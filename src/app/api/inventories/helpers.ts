import type { SupabaseClient } from "@supabase/supabase-js"

export interface InventoryItemInput {
  productId: string
  productName?: string
  quantity: number
}

// Valida y normaliza el arreglo de items de un inventario.
// En creación requiere al menos un producto con cantidad > 0;
// en edición se permite dejar todo en 0 (vacía el inventario).
export function parseInventoryItems(items: unknown, allowEmpty = false): InventoryItemInput[] | null {
  if (!Array.isArray(items)) return null

  const parsed: InventoryItemInput[] = []
  for (const raw of items) {
    if (!raw || typeof raw !== "object") return null
    const item = raw as Record<string, unknown>
    const productId = typeof item.productId === "string" ? item.productId.trim() : ""
    const quantity = Number(item.quantity)
    if (!productId) return null
    if (!Number.isInteger(quantity) || quantity < 0) return null
    parsed.push({
      productId,
      quantity,
      productName: typeof item.productName === "string" ? item.productName : undefined,
    })
  }

  if (parsed.length === 0 && !allowEmpty) return null
  if (!allowEmpty && !parsed.some((p) => p.quantity > 0)) return null
  return parsed
}

export function inventoryItemToRow(item: InventoryItemInput, name: string) {
  return {
    productId: item.productId,
    productName: name,
    quantity: item.quantity,
  }
}

// Valor total del inventario = suma(precio de venta * cantidad) por item.
export function computeInventoryValue(
  products: Array<{ id: string; price?: number | string | null }>,
  items: InventoryItemInput[],
): number {
  const priceById = new Map(products.map((p) => [p.id, Number(p.price) || 0]))
  return items.reduce(
    (sum, item) => sum + (priceById.get(item.productId) ?? 0) * item.quantity,
    0,
  )
}

// Aplica los deltas (cantidad n - cantidad previa) al stock de los productos.
// El stock nunca baja de 0. Solo toca productos con delta != 0.
export async function applyStockDeltas(
  supabase: SupabaseClient,
  deltas: Record<string, number>,
): Promise<void> {
  const ids = Object.keys(deltas).filter((id) => deltas[id] !== 0)
  if (ids.length === 0) return

  const { data: products } = await supabase
    .from("products")
    .select("id, stock")
    .in("id", ids)

  for (const product of products ?? []) {
    const delta = deltas[product.id] ?? 0
    if (delta === 0) continue
    await supabase
      .from("products")
      .update({
        stock: Math.max(0, Number(product.stock ?? 0) + delta),
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id)
  }
}