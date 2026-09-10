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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadProformaRequest } from "@/features/catalog/api/catalog.api"
import { generateProformaPdf } from "@/features/catalog/lib/proforma"
import {
  getEffectivePrice,
  sanitizePhoneNumber,
  type BankAccountInfo,
} from "@/features/catalog/lib/whatsapp"
import { useClients } from "@/features/clients/hooks/use-clients"
import { useCreateOrder } from "@/features/orders/hooks/use-orders"
import { useProducts } from "@/features/products/hooks/use-products"
import { useStore } from "@/features/store/hooks/use-store"
import type { ClientDto } from "@/types/interfaces/client.interface"
import type { OrderItem, PaymentType } from "@/types/interfaces/order.interface"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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

  const selectedProducts = products.filter((p) => (quantities[p.id] ?? 0) > 0)
  const total = selectedProducts.reduce(
    (sum, p) => sum + getEffectivePrice(p) * (quantities[p.id] ?? 0),
    0,
  )
  const itemCount = selectedProducts.reduce((sum, p) => sum + (quantities[p.id] ?? 0), 0)

  const setQuantity = (productId: string, quantity: number) => {
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, quantity) }))
  }

  const reset = () => {
    setClient(null)
    setClientQuery("")
    setClientOpen(false)
    setPaymentType("contado")
    setSearch("")
    setScannerOpen(false)
    setQuantities({})
  }

  const handleSubmit = async () => {
    if (!client || selectedProducts.length === 0) return

    const orderItems: OrderItem[] = selectedProducts.map((p) => ({
      productId: p.id,
      productName: p.name,
      price: getEffectivePrice(p),
      quantity: quantities[p.id] ?? 0,
    }))

    try {
      const order = await createOrder.mutateAsync({
        customerName: client.fullName,
        customerPhone: client.phone,
        items: orderItems,
        total,
        paymentType,
      })

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
      const uploaded = await uploadProformaRequest(blob, client.fullName.replace(/\s+/g, "-"))

      const msg = `Hola ${client.fullName}, le enviamos la *PROFORMA* de su pedido *${order?.orderNumber ?? ""}* por C$ ${total.toFixed(2)}.\n\nPuede descargarla aquí: ${uploaded.url}\n\n*Métodos de pago:*\n${bankAccounts.length > 0 ? bankAccounts.map((a) => `• ${a.bankName} (${a.currency}): ${a.accountNumber}`).join("\n") : "En efectivo al recibir."}\n\nQuedamos a la espera de su confirmación. ¡Gracias!`

      const destPhone = sanitizePhoneNumber(client.phone)
      window.open(
        `https://wa.me/${destPhone}?text=${encodeURIComponent(msg)}`,
        "_blank",
        "noopener,noreferrer",
      )

      onOpenChange(false)
      reset()
    } catch {
      toast.error("No se pudo completar el pedido. Intenta de nuevo.")
    }
  }

  const handleBarcodeScan = (barcode: string) => {
    setSearch(barcode)
    setScannerOpen(false)
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-4 overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Nuevo pedido</DialogTitle>
          <DialogDescription>
            Selecciona el cliente registrado y los productos del pedido.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4">
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

          <div className="flex flex-col gap-2">
            <Label>Modalidad de pago</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  ["contado", "De contado", `1 pago de C$ ${total.toFixed(2)}`],
                  ["cuotas_2", "2 pagos quincenales", `2x C$ ${(total / 2).toFixed(2)}`],
                  ["cuotas_4", "4 pagos semanales", `4x C$ ${(total / 4).toFixed(2)}`],
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
        </div>

        <div className="px-4">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
          {filteredProducts.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
              No hay productos para mostrar.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {filteredProducts.map((product) => {
                const quantity = quantities[product.id] ?? 0
                const price = getEffectivePrice(product)
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
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{product.name}</p>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px]">
                            {product.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {product.discountPercent > 0 && (
                              <span className="mr-1 line-through">C$ {product.price.toFixed(2)}</span>
                            )}
                            C$ {price.toFixed(2)} · Stock {product.stock}
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
                      <span className="w-8 text-center text-sm font-bold tabular-nums">
                        {quantity}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={quantity >= product.stock}
                        onClick={() => setQuantity(product.id, quantity + 1)}
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
        </div>

        <div className="mt-auto flex flex-col gap-3 rounded-b-xl border-t bg-muted/50 px-6 pt-4 pb-6">
          <div className="text-sm text-muted-foreground">
            {itemCount > 0 ? (
              <>
                <span className="font-semibold text-foreground">{itemCount}</span> artículos · Total{" "}
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
    </>
  )
}