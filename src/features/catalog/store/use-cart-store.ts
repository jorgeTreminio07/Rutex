import { create } from "zustand"

import type { ProductDto } from "@/types/interfaces/product.interface"

// El carrito público solo compra unidades enteras; si el stock quedó
// fraccionario (0.5, 1.25…) se limita al entero que cabe.
const availableUnits = (stock: number): number => Math.floor(Math.max(0, stock))

export interface CartLine {
  product: ProductDto
  quantity: number
}

interface CartState {
  items: CartLine[]
  addItem: (product: ProductDto, quantity?: number) => void
  updateQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (product, quantity = 1) =>
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: Math.min(i.quantity + quantity, availableUnits(product.stock)) }
              : i,
          ),
        }
      }
      return { items: [...state.items, { product, quantity: Math.min(quantity, availableUnits(product.stock)) }] }
    }),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.max(0, Math.min(quantity, availableUnits(i.product.stock))) }
          : i,
      ),
    })),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    })),
  clear: () => set({ items: [] }),
}))