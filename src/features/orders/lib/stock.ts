import type { OrderItem } from "@/types/interfaces/order.interface"

export type StockMap = Record<string, number>

// Comprueba que el stock actual alcance para todos los productos de un pedido.
export function orderHasStock(
  items: Pick<OrderItem, "productId" | "quantity">[],
  stockMap: StockMap,
): boolean {
  return items.every((item) => {
    if (!item.productId) return false
    const available = stockMap[item.productId]
    return typeof available === "number" && available >= (item.quantity ?? 0)
  })
}