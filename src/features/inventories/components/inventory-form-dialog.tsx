"use client"

import { MinusIcon, PackageIcon, PlusIcon, SearchIcon } from "lucide-react"
import Image from "next/image"
import { useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { usePaged } from "@/lib/use-paged"
import { roundQty } from "@/lib/format"
import type { InventoryItemDto } from "@/types/interfaces/inventory.interface"
import type { ProductDto } from "@/types/interfaces/product.interface"

const PAGE_SIZE = 10

interface InventoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: ProductDto[]
  initialQuantities?: Record<string, number>
  isPending: boolean
  mode: "create" | "edit"
  onCancel: () => void
  onSubmit: (items: InventoryItemDto[]) => Promise<void>
}

export function InventoryFormDialog({
  open,
  onOpenChange,
  products,
  initialQuantities = {},
  isPending,
  mode,
  onCancel,
  onSubmit,
}: InventoryFormDialogProps) {
  const [search, setSearch] = useState("")
  const [quantities, setQuantities] = useState<Record<string, number>>(() => ({ ...initialQuantities }))
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(q))
  }, [products, search])

  const { rows: visibleProducts, page, totalItems, setPage } = usePaged(filtered, PAGE_SIZE)

  const totalUnits = Object.values(quantities).reduce((sum, q) => sum + (q || 0), 0)
  const productCount = Object.values(quantities).filter((q) => q > 0).length

  const setQuantity = (productId: string, quantity: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, quantity) }))
  }

  const handleQuantityInput = (productId: string, raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, "")
    const firstDot = cleaned.indexOf(".")
    const normalized =
      firstDot === -1
        ? cleaned
        : `${cleaned.slice(0, firstDot)}.${cleaned.slice(firstDot + 1).replace(/\./g, "")}`
    setQtyInputs((prev) => ({ ...prev, [productId]: normalized }))
    const value = normalized === "" || normalized === "." ? 0 : Number(normalized)
    setQuantity(productId, Number.isFinite(value) ? roundQty(Math.max(0, value)) : 0)
  }

  const stepQuantity = (productId: string, delta: number) => {
    setQtyInputs((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
    setQuantity(productId, (quantities[productId] ?? 0) + delta)
  }

  const handleSubmit = async () => {
    const items: InventoryItemDto[] = products
      .filter((p) => (quantities[p.id] ?? 0) > 0)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        quantity: quantities[p.id] ?? 0,
      }))
    await onSubmit(items)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex max-w-2xl flex-col gap-4 overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>{mode === "edit" ? "Editar inventario" : "Nuevo inventario"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Ajusta la cantidad por producto y guarda para actualizar el stock."
              : "Registra la cantidad que entra de cada producto. Todos inician en 0."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar producto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-xl pl-9"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No hay productos para mostrar.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {visibleProducts.map((product) => {
                const quantity = quantities[product.id] ?? 0
                return (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-3 rounded-xl border p-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-9 w-9 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-lg object-cover"
                          />
                        ) : (
                          <PackageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {product.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-xl border p-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={quantity <= 0}
                        onClick={() => stepQuantity(product.id, -1)}
                        aria-label={`Restar ${product.name}`}
                      >
                        <MinusIcon />
                      </Button>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={qtyInputs[product.id] ?? (quantity > 0 ? String(quantity) : "")}
                        onChange={(e) => handleQuantityInput(product.id, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        aria-label={`Cantidad de ${product.name}`}
                        className="w-16 rounded-md border-0 bg-transparent text-center text-sm font-bold tabular-nums outline-none focus:ring-2 focus:ring-ring"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => stepQuantity(product.id, 1)}
                        aria-label={`Sumar ${product.name}`}
                      >
                        <PlusIcon />
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <div className="pt-2">
            <DataTablePagination
              page={page}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 rounded-b-xl border-t bg-muted/50 px-6 pt-4 pb-6">
          <div className="text-sm text-muted-foreground">
            {productCount > 0 ? (
              <>
                <span className="font-semibold text-foreground">{totalUnits}</span> unidades ·{" "}
                {productCount} {productCount === 1 ? "producto" : "productos"}
              </>
            ) : mode === "edit" ? (
              "Todo en 0: al guardar se quitará el stock de esos productos"
            ) : (
              "Agrega al menos una unidad"
            )}
          </div>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || (mode === "create" && totalUnits === 0)}
            >
              {isPending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}