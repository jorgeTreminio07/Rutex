"use client"

import {
  ChevronsUpDownIcon,
  Loader2Icon,
  MinusIcon,
  PackageIcon,
  PhoneIcon,
  PlusIcon,
  ScanBarcodeIcon,
  SearchIcon,
  UserIcon,
  XIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import Image from "next/image"

import { BarcodeScannerDialog } from "@/components/barcode/barcode-scanner-dialog"
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
import { OrderActionDialog } from "@/features/orders/components/order-action-dialog"
import { uploadProformaRequest } from "@/features/catalog/api/catalog.api"
import { generateProformaPdf } from "@/features/catalog/lib/proforma"
import {
  getEffectivePrice,
  type BankAccountInfo,
} from "@/features/catalog/lib/whatsapp"
import { useClients } from "@/features/clients/hooks/use-clients"
import { useCreateOrder, useUpdateOrder } from "@/features/orders/hooks/use-orders"
import { useProducts } from "@/features/products/hooks/use-products"
import { useStore } from "@/features/store/hooks/use-store"
import { usePaged } from "@/lib/use-paged"
import { formatQty, round2, roundQty } from "@/lib/format"
import type { ClientDto } from "@/types/interfaces/client.interface"
import type { OrderDto, OrderItem, PaymentType } from "@/types/interfaces/order.interface"
import type { ProductDto } from "@/types/interfaces/product.interface"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

interface OrderProductRowProps {
  product: ProductDto
  quantity: number
  qtyValue: string
  priceValue: string
  pactado: boolean
  maxQty?: number
  onStep: (delta: number) => void
  onQtyChange: (raw: string) => void
  onPriceChange: (raw: string) => void
  onResetPrice: () => void
  onRemove?: () => void
}

function OrderProductRow({
  product,
  quantity,
  qtyValue,
  priceValue,
  pactado,
  maxQty,
  onStep,
  onQtyChange,
  onPriceChange,
  onResetPrice,
  onRemove,
}: OrderProductRowProps) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border p-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
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
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-medium leading-snug">{product.name}</p>
          <Badge variant="outline" className="mt-1 text-[10px] font-normal">
            {product.category}
          </Badge>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
            {product.discountPercent > 0 && (
              <span className="line-through">C$ {product.price.toFixed(2)}</span>
            )}
            <span className="inline-flex items-center gap-1">
              C$
              <input
                type="text"
                inputMode="decimal"
                value={priceValue}
                onChange={(e) => onPriceChange(e.target.value)}
                onFocus={(e) => e.target.select()}
                aria-label={`Precio pactado de ${product.name}`}
                className="w-16 rounded-md border-0 bg-transparent px-1 text-right text-xs font-semibold text-foreground tabular-nums outline-none focus:ring-2 focus:ring-ring"
              />
            </span>
            <span>· Stock {formatQty(product.stock)}</span>
            {maxQty !== undefined && maxQty !== product.stock && (
              <span>· ajustable hasta {formatQty(maxQty)}</span>
            )}
          </div>
          {pactado && (
            <button
              type="button"
              onClick={onResetPrice}
              className="mt-0.5 text-[10px] font-medium text-primary underline underline-offset-2"
            >
              Restablecer precio oficial
            </button>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <div className="flex shrink-0 items-center gap-1 rounded-xl border p-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={quantity <= 0}
            onClick={() => onStep(-0.5)}
            aria-label={`Restar media unidad de ${product.name}`}
          >
            <MinusIcon />
          </Button>
          <input
            type="text"
            inputMode="decimal"
            value={qtyValue}
            onChange={(e) => onQtyChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            aria-label={`Cantidad de ${product.name}`}
            className="w-16 rounded-md border-0 bg-transparent text-center text-sm font-bold tabular-nums outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={quantity >= (maxQty ?? product.stock)}
            onClick={() => onStep(0.5)}
            aria-label={`Sumar media unidad de ${product.name}`}
          >
            <PlusIcon />
          </Button>
        </div>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label={`Quitar ${product.name} del pedido`}
          >
            <XIcon className="size-4" />
          </Button>
        )}
      </div>
    </li>
  )
}

interface OrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: OrderDto | null
}

export function OrderFormDialog({ open, onOpenChange, order }: OrderFormDialogProps) {
  const isEditing = !!order
  const isEditingApproved = isEditing && order?.statusId === 6
  const createOrder = useCreateOrder()
  const updateOrder = useUpdateOrder()
  const { data: clients = [] } = useClients()
  const { data: products = [] } = useProducts()
  const { data: store } = useStore()

  const [client, setClient] = useState<ClientDto | null>(null)
  const [clientQuery, setClientQuery] = useState(() => order?.customerName ?? "")
  const [clientOpen, setClientOpen] = useState(false)
  const [paymentType, setPaymentType] = useState<PaymentType>(() => order?.paymentType ?? "contado")
  const [search, setSearch] = useState("")
  const [scannerOpen, setScannerOpen] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    (order?.items ?? []).reduce(
      (acc, item) => ({ ...acc, [item.productId]: item.quantity }),
      {} as Record<string, number>,
    ),
  )
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({})
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>(() =>
    (order?.items ?? []).reduce(
      (acc, item) => ({ ...acc, [item.productId]: item.price.toFixed(2) }),
      {} as Record<string, string>,
    ),
  )
  const [createdOrder, setCreatedOrder] = useState<OrderDto | null>(null)

  // Cantidades originales del pedido: al editar un pedido APROBADO, el stock
  // ya tiene descontada esa cantidad, así que se puede subir hasta stock + lo
  // que ya está en el pedido (regla que también valida el servidor).
  const oldQtyById = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of order?.items ?? []) {
      map.set(item.productId, item.quantity)
    }
    return map
  }, [order])

  const maxQtyFor = (product: ProductDto): number => {
    const stock = product.stock
    if (isEditingApproved) return roundQty(stock + (oldQtyById.get(product.id) ?? 0))
    return stock
  }

  const bankAccounts: BankAccountInfo[] = (store?.bankAccounts ?? []).map((a) => ({
    bankName: a.bankName,
    accountNumber: a.accountNumber,
    accountHolder: a.accountHolder,
    currency: a.currency,
  }))

  const clientMatches = useMemo(() => {
    const q = clientQuery.trim().toLowerCase()
    if (!q) return clients.slice(0, 8)
    return clients
      .filter((c) => `${c.fullName} ${c.phone} ${c.cedula ?? ""}`.toLowerCase().includes(q))
      .slice(0, 8)
  }, [clients, clientQuery])

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) =>
      `${p.name} ${p.category} ${p.barcode ?? ""}`.toLowerCase().includes(q),
    )
  }, [products, search])

  // Al editar, el listado de abajo solo sirve para agregar productos nuevos:
  // los ya registrados (cantidad > 0) se gestionan en el bloque de arriba.
  const catalogProducts = isEditing
    ? filteredProducts.filter((p) => (quantities[p.id] ?? 0) === 0)
    : filteredProducts

  const {
    rows: visibleProducts,
    page,
    totalItems,
    setPage,
  } = usePaged(catalogProducts, PAGE_SIZE)

  // Precio de venta por producto: si se pactó un precio en el formulario se
  // usa ese; si no, el vigente (con descuento aplicado).
  const effectivePrice = (product: ProductDto): number => {
    const raw = priceInputs[product.id]
    if (raw === undefined || raw === "" || raw === ".") return getEffectivePrice(product)
    const value = Number(raw)
    return Number.isFinite(value) && value >= 0 ? value : getEffectivePrice(product)
  }

  const isPactado = (product: ProductDto): boolean => {
    const raw = priceInputs[product.id]
    return (
      raw !== undefined &&
      raw !== "" &&
      raw !== "." &&
      Math.abs(effectivePrice(product) - getEffectivePrice(product)) > 0.001
    )
  }

  // Limpia un texto a dígitos con un solo punto decimal.
  const sanitizeDecimal = (raw: string): string => {
    const cleaned = raw.replace(/[^0-9.]/g, "")
    const firstDot = cleaned.indexOf(".")
    return firstDot === -1
      ? cleaned
      : `${cleaned.slice(0, firstDot)}.${cleaned.slice(firstDot + 1).replace(/\./g, "")}`
  }

  const parseDecimalInput = (raw: string): number => {
    const normalized = sanitizeDecimal(raw)
    if (normalized === "" || normalized === ".") return 0
    const value = Number(normalized)
    return Number.isFinite(value) ? Math.max(0, value) : 0
  }

  const selectedProducts = products.filter((p) => (quantities[p.id] ?? 0) > 0)
  const total = selectedProducts.reduce(
    (sum, p) => sum + effectivePrice(p) * (quantities[p.id] ?? 0),
    0,
  )
  const itemCount = selectedProducts.reduce((sum, p) => sum + (quantities[p.id] ?? 0), 0)

  const setQuantity = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId)
    const max = product ? maxQtyFor(product) : 0
    setQuantities((prev) => ({
      ...prev,
      [productId]: roundQty(Math.max(0, Math.min(quantity, max))),
    }))
  }

  const handleQuantityChange = (product: ProductDto, raw: string) => {
    const normalized = sanitizeDecimal(raw)
    setQtyInputs((prev) => ({ ...prev, [product.id]: normalized }))
    setQuantity(product.id, parseDecimalInput(normalized))
  }

  const stepQuantity = (product: ProductDto, delta: number) => {
    setQtyInputs((prev) => {
      const next = { ...prev }
      delete next[product.id]
      return next
    })
    setQuantity(product.id, (quantities[product.id] ?? 0) + delta)
  }

  const removeProduct = (product: ProductDto) => {
    setQtyInputs((prev) => {
      const next = { ...prev }
      delete next[product.id]
      return next
    })
    setPriceInputs((prev) => {
      const next = { ...prev }
      delete next[product.id]
      return next
    })
    setQuantities((prev) => {
      const next = { ...prev }
      delete next[product.id]
      return next
    })
  }

  const handlePriceChange = (productId: string, raw: string) => {
    setPriceInputs((prev) => ({ ...prev, [productId]: sanitizeDecimal(raw) }))
  }

  const resetPrice = (productId: string) => {
    setPriceInputs((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }

  const reset = () => {
    setClient(null)
    setClientQuery("")
    setClientOpen(false)
    setPaymentType("contado")
    setSearch("")
    setScannerOpen(false)
    setQuantities({})
    setQtyInputs({})
    setPriceInputs({})
  }

  const handleSubmit = async () => {
    if (selectedProducts.length === 0) return
    if (!isEditing && !client) return

    const editingOrder = order ?? null
    const orderItems: OrderItem[] = selectedProducts.map((p) => ({
      productId: p.id,
      productName: p.name,
      price: round2(effectivePrice(p)),
      quantity: roundQty(quantities[p.id] ?? 0),
    }))

    try {
      // El cliente es opcional al editar: si no se eligió otro, se conservan
      // los snapshots originales del pedido (nombre/teléfono/dirección).
      let savedOrder: OrderDto | null
      if (editingOrder) {
        savedOrder = await updateOrder.mutateAsync({
          id: editingOrder.id,
          payload: {
            customerName: client?.fullName ?? editingOrder.customerName,
            customerPhone: client?.phone ?? (editingOrder.customerPhone ?? undefined),
            customerAddress: client?.address ?? (editingOrder.customerAddress ?? null),
            items: orderItems,
            total,
            paymentType,
          },
        })
      } else {
        savedOrder = await createOrder.mutateAsync({
          customerName: client!.fullName,
          customerPhone: client!.phone,
          customerAddress: client!.address,
          items: orderItems,
          total,
          paymentType,
        })
      }

      let proformaUrl = savedOrder?.proformaUrl ?? null

      // Best-effort: si el servidor no pudo generar/guardar la proforma,
      // se intenta generarla aquí. Si también falla, no se bloquea el flujo.
      if (!proformaUrl) {
        try {
          const customerName = editingOrder
            ? (client?.fullName ?? editingOrder.customerName)
            : client!.fullName
          const customerPhone = editingOrder
            ? (client?.phone ?? (editingOrder.customerPhone ?? ""))
            : client!.phone
          const pdf = generateProformaPdf({
            storeName: store?.name ?? "Rutex",
            storePhone: store?.phone ?? null,
            customerName,
            customerPhone,
            orderNumber: savedOrder?.orderNumber ?? null,
            items: orderItems,
            total,
            paymentType,
            bankAccounts,
          })

          const blob = new Blob([pdf.output("blob")], { type: "application/pdf" })
          const uploaded = await uploadProformaRequest(blob, customerName)
          proformaUrl = uploaded.url
        } catch (error) {
          console.error("No se pudo generar la proforma cliente:", error)
        }
      }

      const orderWithProforma = savedOrder ? { ...savedOrder, proformaUrl } : savedOrder
      setCreatedOrder(orderWithProforma)
    } catch (error) {
      console.error("No se pudo guardar el pedido:", error)
    }
  }

  const handleBarcodeScan = (barcode: string) => {
    setSearch(barcode)
    setScannerOpen(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>{isEditing ? "Editar pedido" : "Nuevo pedido"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? order?.statusId === 6
                  ? "Pedido aprobado: los cambios ajustan inventario, cartera y proforma."
                  : "Modifica los productos, cantidades, precios o la modalidad de pago. Se regenera la proforma."
                : "Selecciona el cliente registrado y los productos del pedido."}
            </DialogDescription>
          </DialogHeader>

          {/* Contenedor principal con scroll único */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <div className="flex flex-col gap-6">
              {isEditingApproved && (
                <p className="rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary">
                  Pedido aprobado: al guardar se ajusta el stock de los productos (devuelve lo
                  quitado, descuenta lo aumentado), la cartera si cambia el total o la modalidad de
                  pago (conservando lo ya cobrado) y se regenera la proforma.
                </p>
              )}
              {/* Sección de Cliente */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="order-client">{isEditing ? "Cliente" : "Cliente *"}</Label>
                <div className="relative">
                  <Input
                    id="order-client"
                    className="h-10 rounded-xl pr-9"
                    placeholder="Buscar cliente por nombre, teléfono o cédula…"
                    value={clientQuery}
                    aria-invalid={isEditing ? undefined : !client}
                    onChange={(e) => {
                      setClientQuery(e.target.value)
                      setClient(null)
                      setClientOpen(true)
                    }}
                    onFocus={() => setClientOpen(true)}
                    onBlur={() => setClientOpen(false)}
                  />
                  <ChevronsUpDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  {clientOpen && clientMatches.length > 0 && (
                    <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border bg-popover p-1 shadow-md">
                      {clientMatches.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setClient(c)
                              setClientQuery(c.fullName)
                              setClientOpen(false)
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                          >
                            <UserIcon className="size-4 shrink-0 text-muted-foreground" />
                            <span className="truncate font-medium">{c.fullName}</span>
                            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                              {c.phone}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {client ? (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <PhoneIcon className="size-3" />
                    {client.phone}
                  </p>
                ) : isEditing ? (
                  <p className="text-xs text-muted-foreground">
                    Si no se elige un cliente, se conservan los datos actuales del pedido.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    El nombre y teléfono se toman del cliente seleccionado.
                  </p>
                )}
              </div>

              {/* Sección Modalidad de Pago */}
              <div className="flex flex-col gap-2">
                <Label>Modalidad de pago</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(
                    [
                      ["contado", "De contado", `1 pago de C$ ${total.toFixed(2)}`],
                      ...((store?.paymentPlansEnabled ?? true)
                        ? ([
                            ["cuotas_2", "2 pagos quincenales", `2x C$ ${(total / 2).toFixed(2)}`],
                            ["cuotas_4", "4 pagos semanales", `4x C$ ${(total / 4).toFixed(2)}`],
                          ] satisfies [PaymentType, string, string][])
                        : []),
                    ] as [PaymentType, string, string][]
                  ).map(([value, label, detail]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPaymentType(value)}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-xl border p-3 text-left text-xs transition-colors",
                        paymentType === value
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "hover:bg-muted/50",
                      )}
                    >
                      <div>
                        <p className="font-bold">{label}</p>
                        <p className="text-muted-foreground">{detail}</p>
                      </div>
                      <div
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-full border",
                          paymentType === value && "border-primary bg-primary",
                        )}
                      >
                        {paymentType === value && (
                          <div className="size-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sección Buscador de Productos */}
              <div className="flex flex-col gap-2">
                <Label>Productos</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar producto por nombre o código…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-10 rounded-xl pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl"
                    onClick={() => setScannerOpen(true)}
                    aria-label="Escanear código de barras"
                    title="Escanear código de barras"
                  >
                    <ScanBarcodeIcon className="size-5" />
                  </Button>
                </div>
              </div>

              {/* Bloque de productos ya registrados (solo edición) */}
              {isEditing && selectedProducts.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Label>Productos del pedido</Label>
                  <ul className="flex flex-col gap-1.5">
                    {selectedProducts.map((product) => {
                      const quantity = quantities[product.id] ?? 0
                      const price = effectivePrice(product)
                      return (
                        <OrderProductRow
                          key={product.id}
                          product={product}
                          quantity={quantity}
                          qtyValue={qtyInputs[product.id] ?? String(quantity)}
                          priceValue={priceInputs[product.id] ?? price.toFixed(2)}
                          pactado={isPactado(product)}
                          maxQty={isEditingApproved ? maxQtyFor(product) : undefined}
                          onStep={(delta) => stepQuantity(product, delta)}
                          onQtyChange={(raw) => handleQuantityChange(product, raw)}
                          onPriceChange={(raw) => handlePriceChange(product.id, raw)}
                          onResetPrice={() => resetPrice(product.id)}
                          onRemove={() => removeProduct(product)}
                        />
                      )
                    })}
                  </ul>
                </div>
              )}

              {/* Sección Lista de Productos */}
              <div>
                {catalogProducts.length === 0 ? (
                  <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    {isEditing && selectedProducts.length > 0 && search.trim() !== ""
                      ? "No hay productos que coincidan con la búsqueda."
                      : isEditing && selectedProducts.length > 0
                        ? "Todos los productos ya están en el pedido."
                        : "No hay productos para mostrar."}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {visibleProducts.map((product) => {
                      const quantity = quantities[product.id] ?? 0
                      const price = effectivePrice(product)
                      return (
                        <OrderProductRow
                          key={product.id}
                          product={product}
                          quantity={quantity}
                          qtyValue={qtyInputs[product.id] ?? (quantity > 0 ? String(quantity) : "")}
                          priceValue={priceInputs[product.id] ?? price.toFixed(2)}
                          pactado={isPactado(product)}
                          maxQty={isEditingApproved ? maxQtyFor(product) : undefined}
                          onStep={(delta) => stepQuantity(product, delta)}
                          onQtyChange={(raw) => handleQuantityChange(product, raw)}
                          onPriceChange={(raw) => handlePriceChange(product.id, raw)}
                          onResetPrice={() => resetPrice(product.id)}
                        />
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
          </div>

          {/* Footer Fijo */}
          <div className="shrink-0 flex flex-col gap-3 rounded-b-xl border-t bg-muted/50 px-6 py-4">
            <div className="text-sm text-muted-foreground">
              {itemCount > 0 ? (
                <>
                  <span className="font-semibold text-foreground">{formatQty(itemCount)}</span> unidades · Total{" "}
                  <span className="font-semibold text-foreground">C$ {total.toFixed(2)}</span>
                </>
              ) : (
                "Agrega al menos un producto"
              )}
            </div>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  reset()
                }}
                disabled={createOrder.isPending || updateOrder.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  createOrder.isPending || updateOrder.isPending || (!isEditing && !client) || itemCount === 0
                }
              >
                {createOrder.isPending || updateOrder.isPending ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Guardando…
                  </>
                ) : isEditing ? (
                  "Guardar cambios"
                ) : (
                  "Agregar pedido"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BarcodeScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScan}
        description="Apunta la cámara al código de barras para buscar el producto."
      />

      <OrderActionDialog
        open={createdOrder !== null}
        onOpenChange={(open) => {
          if (!open) setCreatedOrder(null)
        }}
        order={createdOrder}
        onComplete={() => {
          setCreatedOrder(null)
          onOpenChange(false)
          reset()
        }}
      />
    </>
  )
}