"use client"

import {
  AlignLeftIcon,
  ChevronsUpDownIcon,
  CircleAlertIcon,
  MinusIcon,
  PackageIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePaged } from "@/lib/use-paged"
import type {
  MermaItemDto,
  MermaMotivoDto,
} from "@/types/interfaces/merma.interface"
import type { ProductDto } from "@/types/interfaces/product.interface"

const PAGE_SIZE = 10

interface MermaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: ProductDto[]
  motivos: MermaMotivoDto[]
  initialMotivoId?: number | null
  initialMotivoName?: string | null
  initialItems?: MermaItemDto[]
  initialObservation?: string | null
  isPending: boolean
  mode: "create" | "edit"
  onCancel: () => void
  onSubmit: (payload: {
    motivoId: number
    items: MermaItemDto[]
    observation: string | null
  }) => Promise<void>
}

export function MermaFormDialog({
  open,
  onOpenChange,
  products,
  motivos,
  initialMotivoId = null,
  initialMotivoName = null,
  initialItems = [],
  initialObservation = null,
  isPending,
  mode,
  onCancel,
  onSubmit,
}: MermaFormDialogProps) {
  const [search, setSearch] = useState("")
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(initialItems.map((item) => [item.productId, item.quantity])),
  )
  const [motivoId, setMotivoId] = useState<number | null>(initialMotivoId)
  const [motivoQuery, setMotivoQuery] = useState(initialMotivoName ?? "")
  const [motivoOpen, setMotivoOpen] = useState(false)
  const [observation, setObservation] = useState(initialObservation ?? "")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => `${p.name} ${p.category} ${p.barcode ?? ""}`.toLowerCase().includes(q))
  }, [products, search])

  const { rows: visibleProducts, page, totalItems, setPage } = usePaged(filtered, PAGE_SIZE)

  const motivosMatches = useMemo(() => {
    const q = motivoQuery.trim().toLowerCase()
    return motivos.filter((m) => m.name.toLowerCase().includes(q))
  }, [motivos, motivoQuery])

  const totalUnits = Object.values(quantities).reduce((sum, q) => sum + (q || 0), 0)
  const productCount = Object.values(quantities).filter((q) => q > 0).length
  const canSave = motivoId !== null && (mode === "edit" || totalUnits > 0)

  // Límite para no dar de baja más de lo que hay en stock. En edición el
  // stock ya tiene descontada la merma actual, así que se le suma lo restado.
  const initialQuantityById = Object.fromEntries(
    initialItems.map((item) => [item.productId, item.quantity]),
  )
  const maxQuantity = (productId: string) => {
    const stock = products.find((p) => p.id === productId)?.stock ?? 0
    return mode === "create" ? stock : stock + (initialQuantityById[productId] ?? 0)
  }

  const setQuantity = (productId: string, quantity: number) => {
    const max = maxQuantity(productId)
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, Math.min(max, quantity)),
    }))
  }

  const handleSubmit = async () => {
    if (!canSave) return
    const items: MermaItemDto[] = products
      .filter((p) => (quantities[p.id] ?? 0) > 0)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        quantity: quantities[p.id] ?? 0,
        purchasePrice: p.purchasePrice,
        sellPrice: p.price,
      }))
    await onSubmit({
      motivoId: motivoId as number,
      items,
      observation: observation.trim() === "" ? null : observation.trim(),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] flex max-w-2xl flex-col gap-4 overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>{mode === "edit" ? "Editar merma" : "Nueva merma"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Ajusta los productos y guarda: el stock se corrige por la diferencia."
              : "Registra la cantidad que se da de baja de cada producto. Todos inician en 0."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-2">
          {/* Motivo */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="merma-motivo">Motivo *</Label>
            <div className="relative">
              <Input
                id="merma-motivo"
                className="h-10 rounded-xl pr-9"
                placeholder="Buscar un motivo…"
                value={motivoQuery}
                aria-invalid={!motivoId}
                onChange={(e) => {
                  setMotivoQuery(e.target.value)
                  setMotivoId(null)
                  setMotivoOpen(true)
                }}
                onFocus={() => setMotivoOpen(true)}
                onBlur={() => setMotivoOpen(false)}
              />
              <ChevronsUpDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              {motivoOpen && motivosMatches.length > 0 && (
                <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border bg-popover p-1 shadow-md">
                  {motivosMatches.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setMotivoId(m.id)
                          setMotivoQuery(m.name)
                          setMotivoOpen(false)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <CircleAlertIcon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium">{m.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="merma-observation">
              <span className="inline-flex items-center gap-1">
                <AlignLeftIcon className="size-3.5" />
                Observaciones
              </span>
            </Label>
            <Textarea
              id="merma-observation"
              placeholder="Comentario opcional sobre la merma…"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="resize-none"
            />
          </div>

          {/* Buscador de productos */}
          <div className="flex flex-col gap-2">
            <Label>Productos</Label>
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

          <div>
            {filtered.length === 0 ? (
              <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                No hay productos para mostrar.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {visibleProducts.map((product) => {
                  const quantity = quantities[product.id] ?? 0
                  const max = maxQuantity(product.id)
                  const reachedMax = quantity >= max
                  return (
                    <li
                      key={product.id}
                      className="flex items-center justify-between gap-3 rounded-xl border p-2.5"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                          {product.images[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={44}
                              height={44}
                              className="h-11 w-11 rounded-lg object-cover"
                            />
                          ) : (
                            <PackageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium leading-snug">{product.name}</p>
                          <Badge variant="outline" className="mt-1 text-[10px]">
                            {product.category}
                          </Badge>
                          <div className="mt-1.5 flex flex-col gap-0.5 text-xs text-muted-foreground">
                            <span>
                              Stock:{" "}
                              <span className="font-semibold text-foreground">
                                {product.stock}
                              </span>
                            </span>
                            <span>
                              Máx. baja:{" "}
                              <span className="font-semibold text-foreground">{max}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 rounded-xl border p-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={quantity <= 0}
                          onClick={() => setQuantity(product.id, quantity - 1)}
                          aria-label={`Restar ${product.name}`}
                        >
                          <MinusIcon />
                        </Button>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={quantity}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, "")
                            setQuantity(product.id, raw === "" ? 0 : parseInt(raw, 10))
                          }}
                          onFocus={(e) => e.target.select()}
                          aria-label={`Cantidad de ${product.name}`}
                          className="w-12 rounded-md border-0 bg-transparent text-center text-sm font-bold tabular-nums outline-none focus:ring-2 focus:ring-ring"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          disabled={reachedMax}
                          onClick={() => setQuantity(product.id, quantity + 1)}
                          aria-label={`Sumar ${product.name}`}
                          title={
                            reachedMax
                              ? "No se puede dar de baja más de lo que hay en stock"
                              : undefined
                          }
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
        </div>

        <div className="mt-auto flex flex-col gap-3 rounded-b-xl border-t bg-muted/50 px-6 pt-4 pb-6">
          <div className="text-sm text-muted-foreground">
            {productCount > 0 ? (
              <>
                <span className="font-semibold text-foreground">{totalUnits}</span> unidades ·{" "}
                {productCount} {productCount === 1 ? "producto" : "productos"}{" "}
                {mode === "create" ? "se darán de baja del stock" : "a considerar"}
              </>
            ) : mode === "edit" ? (
              "Todo en 0: al guardar se devolverá el stock de esos productos"
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
              disabled={isPending || !canSave}
              title={!motivoId ? "Selecciona un motivo primero" : undefined}
            >
              {isPending ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}