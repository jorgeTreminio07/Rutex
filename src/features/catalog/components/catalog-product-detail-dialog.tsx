"use client"

import { MinusIcon, PlusIcon, ShoppingCartIcon } from "lucide-react"
import Image from "next/image"
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
import { fmtMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { ProductDto } from "@/types/interfaces/product.interface"

interface CatalogProductDetailDialogProps {
  product: ProductDto | null
  inCart: number
  showStock: boolean
  onClose: () => void
  onAdd: (product: ProductDto, quantity: number) => void
}

export function CatalogProductDetailDialog({
  product,
  inCart,
  showStock,
  onClose,
  onAdd,
}: CatalogProductDetailDialogProps) {
  const [quantity, setQuantity] = useState(1)

  if (!product) return null

  const price = getEffectivePrice(product)
  const outOfStock = product.stock <= 0
  const availableUnits = Math.floor(product.stock)
  const hasDiscount = product.discountPercent > 0
  const image = product.images[0]

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
              <Image
                src={image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover"
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
                  {fmtMoney(product.price)}
                </span>
              )}
              <span className={cn("text-2xl font-extrabold", hasDiscount && "text-destructive")}>
                {fmtMoney(price)}
              </span>
            </div>
            {outOfStock && (
              <Badge variant="destructive" className="mt-2">Agotado</Badge>
            )}
            {!outOfStock && showStock && (
              <p className="mt-1 text-xs text-muted-foreground">
                {availableUnits} disponible{availableUnits === 1 ? "" : "s"} en stock
              </p>
            )}
            {!outOfStock && inCart > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Ya tienes {inCart} en el carrito.
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
                onClick={() => setQuantity((q) => Math.min(Math.floor(product.stock), q + 1))}
                disabled={outOfStock || quantity >= Math.floor(product.stock)}
                aria-label="Aumentar cantidad"
              >
                <PlusIcon />
              </Button>
            </div>
            <Button
              className="flex-1 gap-2"
              disabled={outOfStock || quantity > Math.floor(product.stock) - inCart}
              onClick={() => {
                onAdd(product, quantity)
                onClose()
              }}
            >
              <ShoppingCartIcon className="size-4" />
              Agregar al carrito · {fmtMoney(price * quantity)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}