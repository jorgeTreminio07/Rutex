"use client"

import { MinusIcon, PlusIcon, ShoppingCartIcon } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { getEffectivePrice } from "@/features/catalog/lib/whatsapp"
import { cn } from "@/lib/utils"
import type { ProductDto } from "@/types/interfaces/product.interface"

interface CatalogProductCardProps {
  product: ProductDto
  quantity: number
  showStock: boolean
  onSelect: () => void
  onAdd: () => void
  onIncrement: () => void
  onDecrement: () => void
}

export function CatalogProductCard({
  product,
  quantity,
  showStock,
  onSelect,
  onAdd,
  onIncrement,
  onDecrement,
}: CatalogProductCardProps) {
  const outOfStock = product.stock <= 0
  const availableUnits = Math.floor(product.stock)
  const price = getEffectivePrice(product)
  const hasDiscount = product.discountPercent > 0
  const image = product.images[0]

  return (
    <div
      onClick={onSelect}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = "none"
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-muted-foreground/40">
            {product.name[0]?.toUpperCase() ?? "P"}
          </div>
        )}

        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-foreground backdrop-blur">
            {product.category}
          </span>
          {hasDiscount && (
            <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
              -{product.discountPercent}% OFF
            </span>
          )}
        </div>

        {outOfStock && (
          <span className="absolute top-2 right-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
            Agotado
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div>
          <h3 className="truncate text-sm font-semibold">{product.name}</h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">{product.description ?? ""}</p>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <div>
            {hasDiscount && (
              <span className="block text-[10px] text-muted-foreground line-through">
                C$ {product.price.toFixed(2)}
              </span>
            )}
            <span className={cn("text-base font-bold", hasDiscount && "text-destructive")}>
              C$ {price.toFixed(2)}
            </span>
          </div>

          {showStock && !outOfStock && (
            <span className="text-[10px] font-medium text-muted-foreground">
              {availableUnits} disponible{availableUnits === 1 ? "" : "s"}
            </span>
          )}

          {quantity > 0 ? (
            <div className="flex w-full items-center justify-center gap-1 rounded-full border p-0.5">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onDecrement()
                }}
                aria-label={`Quitar ${product.name}`}
              >
                <MinusIcon />
              </Button>
              <span className="w-6 text-center text-xs font-bold">{quantity}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onIncrement()
                }}
                disabled={outOfStock || quantity >= Math.floor(product.stock)}
                aria-label={`Agregar ${product.name}`}
              >
                <PlusIcon />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={outOfStock || quantity >= Math.floor(product.stock)}
              onClick={(e) => {
                e.stopPropagation()
                onAdd()
              }}
              className="w-full gap-1 rounded-full text-xs"
            >
              <ShoppingCartIcon className="size-3.5" />
              Agregar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}