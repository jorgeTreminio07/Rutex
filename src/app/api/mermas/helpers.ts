import type { SupabaseClient } from "@supabase/supabase-js"

export interface MermaItemInput {
  productId: string
  productName?: string
  quantity: number
}

// Valida y normaliza el arreglo de items de una merma.
// En creación requiere al menos un producto con cantidad > 0;
// en edición se permite dejar todo en 0 (vacía la merma).
export function parseMermaItems(items: unknown, allowEmpty = false): MermaItemInput[] | null {
  if (!Array.isArray(items)) return null

  const parsed: MermaItemInput[] = []
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

export function mermaItemToRow(
  item: MermaItemInput,
  name: string,
  purchasePrice: number,
  sellPrice: number,
) {
  return {
    productId: item.productId,
    productName: name,
    quantity: item.quantity,
    purchasePrice,
    sellPrice,
  }
}

// Valor total de la merma = suma(precio de venta * cantidad) por item.
export function computeMermaValue(
  products: Array<{ id: string; price?: number | string | null }>,
  items: MermaItemInput[],
): number {
  const priceById = new Map(products.map((p) => [p.id, Number(p.price) || 0]))
  return items.reduce(
    (sum, item) => sum + (priceById.get(item.productId) ?? 0) * item.quantity,
    0,
  )
}

// Valida que no se dé de baja más de lo que hay en stock.
// En edición, el stock ya tiene descontada la merma actual, así que se
// pasa `allowanceById` (cantidad ya restada por producto) para sumarla.
export function validateStock(
  products: Array<{ id: string; name: string; stock?: number | string | null }>,
  items: MermaItemInput[],
  allowanceById: Map<string, number> = new Map(),
): { ok: true } | { ok: false; message: string } {
  const stockById = new Map(products.map((p) => [p.id, Number(p.stock) || 0]))
  for (const item of items) {
    if (item.quantity <= 0) continue
    const stock = stockById.get(item.productId) ?? 0
    const maxAllowed = stock + (allowanceById.get(item.productId) ?? 0)
    if (item.quantity > maxAllowed) {
      const name = products.find((p) => p.id === item.productId)?.name ?? "Producto"
      return {
        ok: false,
        message: `Stock insuficiente para dar de baja "${name}": hay ${stock} en stock y solicitaste ${item.quantity}.`,
      }
    }
  }
  return { ok: true }
}

// Aplica los ajustes de stock (deltas) a los productos.
// En una merma los deltas son negativos (baja de stock) y al
// eliminar/editar pueden ser positivos (se devuelve stock).
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