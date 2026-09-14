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
import { useCreateOrder } from "@/features/orders/hooks/use-orders"
import { useProducts } from "@/features/products/hooks/use-products"
import { useStore } from "@/features/store/hooks/use-store"
import { usePaged } from "@/lib/use-paged"
import { formatQty, round2, roundQty } from "@/lib/format"
import type { ClientDto } from "@/types/interfaces/client.interface"
import type { OrderDto, OrderItem, PaymentType } from "@/types/interfaces/order.interface"
import type { ProductDto } from "@/types/interfaces/product.interface"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

interface OrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OrderFormDialog({ open, onOpenChange }: OrderFormDialogProps) {
  const createOrder = useCreateOrder()
  const { data: clients = [] } = useClients()
  const { data: products = [] } = useProducts()
  const { data: store } = useStore()

  const [client, setClient] = useState<ClientDto | null>(null)
  const [clientQuery, setClientQuery] = useState("")
  const [clientOpen, setClientOpen] = useState(false)
  const [paymentType, setPaymentType] = useState<PaymentType>("contado")
  const [search, setSearch] = useState("")
  const [scannerOpen, setScannerOpen] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({})
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({})
  const [createdOrder, setCreatedOrder] = useState<OrderDto | null>(null)

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

  const {
    rows: visibleProducts,
    page,
    totalItems,
    setPage,
  } = usePaged(filteredProducts, PAGE_SIZE)

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
    const stock = products.find((p) => p.id === productId)?.stock ?? 0
    setQuantities((prev) => ({
      ...prev,
      [productId]: roundQty(Math.max(0, Math.min(quantity, stock))),
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
    if (!client || selectedProducts.length === 0) return

    const orderItems: OrderItem[] = selectedProducts.map((p) => ({
      productId: p.id,
      productName: p.name,
      price: round2(effectivePrice(p)),
      quantity: roundQty(quantities[p.id] ?? 0),
    }))

    try {
      const order = await createOrder.mutateAsync({
        customerName: client.fullName,
        customerPhone: client.phone,
        customerAddress: client.address,
        items: orderItems,
        total,
        paymentType,
      })

      let proformaUrl = order?.proformaUrl ?? null

      // Best-effort: si el servidor no pudo generar/guardar la proforma,
      // se intenta generarla aquí. Si también falla, no se bloquea el flujo.
      if (!proformaUrl) {
        try {
          const pdf = generateProformaPdf({
            storeName: store?.name ?? "Rutex",
            storePhone: store?.phone ?? null,
            customerName: client.fullName,
            customerPhone: client.phone,
            orderNumber: order?.orderNumber ?? null,
            items: orderItems,
            total,
            paymentType,
            bankAccounts,
          })

          const blob = new Blob([pdf.output("blob")], { type: "application/pdf" })
          const uploaded = await uploadProformaRequest(blob, client.fullName)
          proformaUrl = uploaded.url
        } catch (error) {
          console.error("No se pudo generar la proforma cliente:", error)
        }
      }

      const orderWithProforma = order ? { ...order, proformaUrl } : order
      setCreatedOrder(orderWithProforma)
    } catch (error) {
      console.error("No se pudo crear el pedido:", error)
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
            <DialogTitle>Nuevo pedido</DialogTitle>
            <DialogDescription>
              Selecciona el cliente registrado y los productos del pedido.
            </DialogDescription>
          </DialogHeader>

          {/* Contenedor principal con scroll único */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            <div className="flex flex-col gap-6">
              {/* Sección de Cliente */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="order-client">Cliente *</Label>
                <div className="relative">
                  <Input
                    id="order-client"
                    className="h-10 rounded-xl pr-9"
                    placeholder="Buscar cliente por nombre, teléfono o cédula…"
                    value={clientQuery}
                    aria-invalid={!client}
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

              {/* Sección Lista de Productos */}
              <div>
                {filteredProducts.length === 0 ? (
                  <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No hay productos para mostrar.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {visibleProducts.map((product) => {
                      const quantity = quantities[product.id] ?? 0
                      const price = effectivePrice(product)
                      return (
                        <li
                          key={product.id}
                          className="flex items-center justify-between gap-3 rounded-xl border p-2.5"
                        >
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
                              <p className="break-words text-sm font-medium leading-snug">
                                {product.name}
                              </p>
                              <Badge
                                variant="outline"
                                className="mt-1 text-[10px] font-normal"
                              >
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
                                    value={priceInputs[product.id] ?? price.toFixed(2)}
                                    onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                    onFocus={(e) => e.target.select()}
                                    aria-label={`Precio pactado de ${product.name}`}
                                    className="w-16 rounded-md border-0 bg-transparent px-1 text-right text-xs font-semibold text-foreground tabular-nums outline-none focus:ring-2 focus:ring-ring"
                                  />
                                </span>
                                <span>· Stock {formatQty(product.stock)}</span>
                              </div>
                              {isPactado(product) && (
                                <button
                                  type="button"
                                  onClick={() => resetPrice(product.id)}
                                  className="mt-0.5 text-[10px] font-medium text-primary underline underline-offset-2"
                                >
                                  Restablecer precio oficial
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1 rounded-xl border p-0.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={quantity <= 0}
                              onClick={() => stepQuantity(product, -0.5)}
                              aria-label={`Restar media unidad de ${product.name}`}
                            >
                              <MinusIcon />
                            </Button>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={qtyInputs[product.id] ?? (quantity > 0 ? String(quantity) : "")}
                              onChange={(e) => handleQuantityChange(product, e.target.value)}
                              onFocus={(e) => e.target.select()}
                              aria-label={`Cantidad de ${product.name}`}
                              className="w-16 rounded-md border-0 bg-transparent text-center text-sm font-bold tabular-nums outline-none focus:ring-2 focus:ring-ring"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              disabled={quantity >= product.stock}
                              onClick={() => stepQuantity(product, 0.5)}
                              aria-label={`Sumar media unidad de ${product.name}`}
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
                disabled={createOrder.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={createOrder.isPending || !client || itemCount === 0}
              >
                {createOrder.isPending ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Guardando…
                  </>
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