"use client"

import { ChevronDownIcon, SearchIcon, Share2Icon, ShoppingCartIcon, StoreIcon } from "lucide-react"
import Image from "next/image"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useCatalog } from "@/features/catalog/hooks/use-catalog"
import { CatalogProductCard } from "@/features/catalog/components/catalog-product-card"
import { CatalogProductDetailDialog } from "@/features/catalog/components/catalog-product-detail-dialog"
import { useCartStore } from "@/features/catalog/store/use-cart-store"
import { useAuthStore } from "@/features/auth/store/use-auth-store"
import { getAssetUrl } from "@/lib/assets"
import { cn } from "@/lib/utils"
import type { ProductDto } from "@/types/interfaces/product.interface"

export function CatalogView() {
  const { data, isLoading } = useCatalog()
  const { items, addItem, updateQuantity } = useCartStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const router = useRouter()
  const [category, setCategory] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [showAvailable, setShowAvailable] = useState(false)
  const [selected, setSelected] = useState<ProductDto | null>(null)

  const products = useMemo(() => data?.products ?? [], [data])
  const store = useMemo(
    () => data?.store ?? { name: "Rutex", logoUrl: null, phone: null, paymentPlansEnabled: true, showStockInCatalog: false },
    [data],
  )

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
      if (showAvailable && p.stock <= 0) return false
      return true
    })
  }, [products, category, search, showAvailable])

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const logoUrl = getAssetUrl(store.logoUrl)

  const goToCart = () => router.push("/catalogo/carrito")

  const handleShareCatalog = () => {
    const url = `${window.location.origin}/catalogo`
    const text = `¡Hola! Te comparto el catálogo de ${store.name}. Podés ver nuestros productos y hacer tu pedido desde este link:\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 py-5">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <Image src={logoUrl} alt={store.name} width={40} height={40} className="h-10 w-10 rounded-xl object-cover" />
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

        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
          {isAuthenticated && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="relative gap-2 rounded-full"
              onClick={handleShareCatalog}
            >
              <Share2Icon className="size-4" />
              Compartir catálogo
            </Button>
          )}
          <Button variant="outline" size="sm" className="relative gap-2 rounded-full" onClick={goToCart}>
            <ShoppingCartIcon className="size-4" />
            Carrito
            {cartCount > 0 && (
              <Badge className="ml-1 size-5 items-center justify-center rounded-full p-0 text-[10px]">
                {cartCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {/* Search + categories */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar productos…"
                className="h-11 rounded-xl pl-9"
              />
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <span className="shrink-0 text-xs font-medium whitespace-nowrap text-muted-foreground">
                Mostrar disponibles
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={showAvailable}
                aria-label="Mostrar disponibles"
                title="Mostrar solo productos en stock"
                onClick={() => setShowAvailable((prev) => !prev)}
                className={cn(
                  "inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border p-0.5 transition-colors outline-none",
                  "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring",
                  showAvailable ? "border-transparent bg-primary" : "border-border bg-input/50",
                )}
              >
                <span
                  className={cn(
                    "size-5 rounded-full bg-background shadow-sm transition-transform duration-300 ease-in-out",
                    showAvailable ? "translate-x-4" : "translate-x-0",
                  )}
                />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button type="button" variant="outline" size="sm" className="gap-2 rounded-full">
                    <span className="max-w-44 truncate">{category ?? "Todas"}</span>
                    <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="min-w-48">
                <DropdownMenuItem
                  onClick={() => setCategory(null)}
                  className={cn(category === null && "bg-accent text-accent-foreground")}
                >
                  Todas las categorías
                </DropdownMenuItem>
                {categories.length > 0 && <DropdownMenuSeparator />}
                {categories.map((cat) => (
                  <DropdownMenuItem
                    key={cat}
                    onClick={() => setCategory(cat === category ? null : cat)}
                    className={cn(category === cat && "bg-accent text-accent-foreground")}
                  >
                    <span className="truncate">{cat}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
                  showStock={store.showStockInCatalog}
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

      <CatalogProductDetailDialog
        key={selected?.id ?? "none"}
        product={selected}
        inCart={selected ? (items.find((i) => i.product.id === selected.id)?.quantity ?? 0) : 0}
        showStock={store.showStockInCatalog}
        onClose={() => setSelected(null)}
        onAdd={addItem}
      />
    </div>
  )
}