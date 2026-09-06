"use client"

import { ArrowLeftIcon, SearchIcon, ShoppingCartIcon, StoreIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCatalog } from "@/features/catalog/hooks/use-catalog"
import { CatalogCart } from "@/features/catalog/components/catalog-cart"
import { CatalogProductCard } from "@/features/catalog/components/catalog-product-card"
import { CatalogProductDetailDialog } from "@/features/catalog/components/catalog-product-detail-dialog"
import { useCartStore } from "@/features/catalog/store/use-cart-store"
import { getAssetUrl } from "@/lib/assets"
import { cn } from "@/lib/utils"
import type { ProductDto } from "@/types/interfaces/product.interface"

interface CatalogViewProps {
  isAuthenticated: boolean
}

export function CatalogView({ isAuthenticated }: CatalogViewProps) {
  const { data, isLoading } = useCatalog()
  const { items, addItem, updateQuantity, removeItem, clear } = useCartStore()
  const [category, setCategory] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [showCart, setShowCart] = useState(false)
  const [selected, setSelected] = useState<ProductDto | null>(null)

  const products = useMemo(() => data?.products ?? [], [data])
  const store = useMemo(() => data?.store ?? { name: "Rutex", logoUrl: null, phone: null }, [data])
  const bankAccounts = useMemo(() => data?.bankAccounts ?? [], [data])

  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => set.add(p.category))
    return Array.from(set).sort()
  }, [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (category && p.category !== category) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q ?? "")) return false
      return true
    })
  }, [products, category, search])

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const logoUrl = getAssetUrl(store.logoUrl)

  const goToStore = () => {
    setShowCart(false)
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 py-5">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={store.name} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <StoreIcon className="size-5" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">{store.name}</h1>
            <p className="text-xs text-muted-foreground">Tienda oficial · Catálogo en línea</p>
          </div>
        </div>

        <Button
          variant={showCart ? "default" : "outline"}
          size="sm"
          className="relative gap-2 rounded-full"
          onClick={() => setShowCart((v) => !v)}
        >
          {showCart ? <ArrowLeftIcon className="size-4" /> : <ShoppingCartIcon className="size-4" />}
          {showCart ? "Ver catálogo" : "Carrito"}
          {cartCount > 0 && (
            <Badge className="ml-1 size-5 items-center justify-center rounded-full p-0 text-[10px]">
              {cartCount}
            </Badge>
          )}
        </Button>
      </div>

      {showCart ? (
        <CatalogCart
          items={items}
          storeName={store.name}
          storePhone={store.phone}
          bankAccounts={bankAccounts}
          isAuthenticated={isAuthenticated}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onClear={clear}
          onGoBack={goToStore}
        />
      ) : (
        <div className="space-y-5">
          {/* Search + categories */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos…"
                className="h-11 rounded-xl pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                  category === null
                    ? "bg-foreground text-background"
                    : "border text-muted-foreground hover:bg-muted",
                )}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat === category ? null : cat)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                    category === cat ? "bg-foreground text-background" : "border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              No se encontraron productos.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {filtered.map((product) => {
                const line = items.find((i) => i.product.id === product.id)
                return (
                  <CatalogProductCard
                    key={product.id}
                    product={product}
                    quantity={line?.quantity ?? 0}
                    onSelect={() => setSelected(product)}
                    onAdd={() => addItem(product)}
                    onIncrement={() => addItem(product, 1)}
                    onDecrement={() => updateQuantity(product.id, (line?.quantity ?? 0) - 1)}
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      <CatalogProductDetailDialog
        product={selected}
        onClose={() => setSelected(null)}
        onAdd={addItem}
      />
    </div>
  )
}