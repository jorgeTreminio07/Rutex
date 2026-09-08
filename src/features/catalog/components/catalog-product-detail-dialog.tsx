"use client"

import { MinusIcon, PlusIcon, ShoppingCartIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { getEffectivePrice } from "@/features/catalog/lib/whatsapp"
import { cn } from "@/lib/utils"
import type { ProductDto } from "@/types/interfaces/product.interface"

interface CatalogProductDetailDialogProps {
  product: ProductDto | null
  inCart: number
  onClose: () => void
  onAdd: (product: ProductDto, quantity: number) => void
}

export function CatalogProductDetailDialog({
  product,
  inCart,
  onClose,
  onAdd,
}: CatalogProductDetailDialogProps) {
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const price = getEffectivePrice(product)
  const outOfStock = product.stock <= 0
  const hasDiscount = product.discountPercent > 0
  const image = product.images[0]
  const max = Math.max(0, product.stock - inCart)
  const cannotAddMore = outOfStock || max <= 0

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{product.category}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
            {image ? (
              <img
                src={image}
                alt={product.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none"
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl text-muted-foreground/30">
                {product.name[0]?.toUpperCase() ?? "P"}
              </div>
            )}
            {hasDiscount && (
              <Badge variant="destructive" className="absolute top-2 left-2">
                -{product.discountPercent}% OFF
              </Badge>
            )}
            {outOfStock && (
              <Badge variant="destructive" className="absolute top-2 right-2">
                Agotado
              </Badge>
            )}
          </div>

          <div>
            <div className="flex items-end gap-2">
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  C$ {product.price.toFixed(2)}
                </span>
              )}
              <span className={cn("text-2xl font-extrabold", hasDiscount && "text-destructive")}>
                C$ {price.toFixed(2)}
              </span>
            </div>
            {outOfStock ? (
              <Badge variant="destructive" className="mt-2">Agotado</Badge>
            ) : (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">
                {product.stock} disponibles
              </span>
            )}
            {!outOfStock && inCart > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Ya tienes {inCart} en el carrito. Puedes agregar {Math.max(0, product.stock - inCart)} más.
              </p>
            )}
          </div>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description || "Sin descripción."}
          </p>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border p-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Disminuir cantidad"
              >
                <MinusIcon />
              </Button>
              <span className="w-8 text-center text-sm font-bold">{quantity}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={outOfStock || quantity >= product.stock}
                aria-label="Aumentar cantidad"
              >
                <PlusIcon />
              </Button>
            </div>
            <Button
              className="flex-1 gap-2"
              disabled={outOfStock || quantity > product.stock - inCart}
              onClick={() => {
                onAdd(product, quantity)
                onClose()
              }}
            >
              <ShoppingCartIcon className="size-4" />
              Agregar al carrito · C$ {(price * quantity).toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}