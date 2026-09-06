"use client"

import { CreditCardIcon, MinusIcon, PhoneIcon, PlusIcon, SendIcon, ShoppingBagIcon, Trash2Icon, UserIcon } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BankAccountInfo } from "@/features/catalog/lib/whatsapp"
import { generateProformaPdf } from "@/features/catalog/lib/proforma"
import {
  cartTotal,
  cartToOrderItems,
  generateOrderWhatsAppUrl,
  sanitizePhoneNumber,
} from "@/features/catalog/lib/whatsapp"
import { useCreateOrder } from "@/features/orders/hooks/use-orders"
import { uploadProformaRequest } from "@/features/catalog/api/catalog.api"
import type { CartLine } from "@/features/catalog/store/use-cart-store"
import type { PaymentType } from "@/types/interfaces/order.interface"
import { cn } from "@/lib/utils"

interface CatalogCartProps {
  items: CartLine[]
  storeName: string
  storePhone: string | null
  bankAccounts: BankAccountInfo[]
  isAuthenticated: boolean
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onClear: () => void
  onGoBack: () => void
}

export function CatalogCart({
  items,
  storeName,
  storePhone,
  bankAccounts,
  isAuthenticated,
  onUpdateQuantity,
  onRemoveItem,
  onClear,
  onGoBack,
}: CatalogCartProps) {
  const createOrder = useCreateOrder()
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [paymentType, setPaymentType] = useState<PaymentType>("contado")
  const [isGeneratingProforma, setIsGeneratingProforma] = useState(false)

  const total = cartTotal(items)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  const valid = customerName.trim().length > 2 && customerPhone.trim().length >= 8

  const handlePlaceOrder = async () => {
    if (!valid) return
    const orderItems = cartToOrderItems(items)
    const order = await createOrder.mutateAsync({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: orderItems,
      total,
      paymentType,
    })
    if (order) {
      const url = generateOrderWhatsAppUrl({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: orderItems,
        total,
        orderNumber: order.orderNumber ?? undefined,
        paymentType,
        targetPhoneNumber: storePhone ?? undefined,
      })
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  const handleSendProforma = async () => {
    if (!valid) return
    setIsGeneratingProforma(true)
    try {
      const orderItems = cartToOrderItems(items)
      const order = await createOrder.mutateAsync({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: orderItems,
        total,
        paymentType,
      })

      const pdf = generateProformaPdf({
        storeName,
        storePhone,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        orderNumber: order?.orderNumber,
        items: orderItems,
        total,
        paymentType,
        bankAccounts,
      })

      const blob = new Blob([pdf.output("blob")], { type: "application/pdf" })
      const uploaded = await uploadProformaRequest(blob, customerName.trim().replace(/\s+/g, "-"))

      const msg = `Hola ${customerName.trim()}, le enviamos la *PROFORMA* de su pedido *${order?.orderNumber ?? ""}* por C$ ${total.toFixed(2)}.\n\nPuede descargarla aquí: ${uploaded.url}\n\n*Métodos de pago:*\n${bankAccounts.length > 0 ? bankAccounts.map((a) => `• ${a.bankName} (${a.currency}): ${a.accountNumber}`).join("\n") : "En efectivo al recibir."}\n\nQuedamos a la espera de su confirmación. ¡Gracias!`

      const destPhone = sanitizePhoneNumber(customerPhone.trim())
      window.open(`https://wa.me/${destPhone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer")
    } finally {
      setIsGeneratingProforma(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ShoppingBagIcon className="size-8" />
        </div>
        <h2 className="text-lg font-bold">Tu carrito está vacío</h2>
        <p className="text-sm text-muted-foreground">
          Explora el catálogo y agrega tus productos favoritos.
        </p>
        <Button variant="outline" onClick={onGoBack}>
          Ir a comprar
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-3 lg:col-span-7">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">
            Productos en tu carrito{" "}
            <span className="text-sm font-normal text-muted-foreground">({itemCount} artículos)</span>
          </h2>
          <Button variant="ghost" size="sm" className="text-destructive" onClick={onClear}>
            <Trash2Icon className="size-4" />
            Vaciar
          </Button>
        </div>

        <div className="divide-y rounded-2xl border">
          {items.map(({ product, quantity }) => {
            const price = product.discountPercent > 0 ? product.price * (1 - product.discountPercent / 100) : product.price
            return (
              <div key={product.id} className="flex items-center gap-3 p-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                      {product.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold">{product.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {product.discountPercent > 0 && (
                      <span className="mr-1 line-through">C$ {product.price.toFixed(2)}</span>
                    )}
                    C$ {price.toFixed(2)} c/u
                  </p>
                  <p className="mt-0.5 text-xs font-bold">C$ {(price * quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 rounded-xl border p-0.5">
                  <Button variant="ghost" size="icon-sm" onClick={() => onUpdateQuantity(product.id, quantity - 1)}>
                    <MinusIcon />
                  </Button>
                  <span className="w-7 text-center text-xs font-bold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={quantity >= product.stock}
                    onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                  >
                    <PlusIcon />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive"
                  onClick={() => onRemoveItem(product.id)}
                  aria-label={`Eliminar ${product.name}`}
                >
                  <Trash2Icon />
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-4 lg:col-span-5">
        <Card className="p-5">
          <h2 className="mb-4 text-base font-bold">Datos del cliente</h2>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cc-name">
                <UserIcon className="mr-1 inline size-3.5" />
                Nombre completo *
              </Label>
              <Input
                id="cc-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cc-phone">
                <PhoneIcon className="mr-1 inline size-3.5" />
                Teléfono *
              </Label>
              <Input
                id="cc-phone"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Ej. 89098184"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label>
                <CreditCardIcon className="mr-1 inline size-3.5" />
                Modalidad de pago
              </Label>
              <div className="grid grid-cols-1 gap-2">
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
                      {paymentType === value && <div className="size-1.5 rounded-full bg-primary-foreground" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-3 p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">C$ {total.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Envío por</span>
            <Badge variant="outline">WhatsApp</Badge>
          </div>
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold">Total</span>
              <span className="text-base font-extrabold text-primary">C$ {total.toFixed(2)}</span>
            </div>
          </div>

          {!isAuthenticated ? (
            <Button className="w-full gap-2" size="lg" disabled={!valid} onClick={handlePlaceOrder}>
              <SendIcon className="size-4" />
              Pedir por WhatsApp
            </Button>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              <Button className="w-full gap-2" size="lg" disabled={!valid} onClick={handlePlaceOrder}>
                <SendIcon className="size-4" />
                Agregar pedido
              </Button>
              <Button
                className="w-full gap-2"
                size="lg"
                variant="outline"
                disabled={!valid || isGeneratingProforma}
                onClick={handleSendProforma}
              >
                {isGeneratingProforma ? "Generando proforma…" : "Enviar proforma"}
              </Button>
            </div>
          )}

          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            Al hacer clic se registrará tu pedido y se abrirá WhatsApp para enviar la solicitud al
            {storePhone ? ` +${storePhone}` : " equipo"} de {storeName}.
          </p>
        </Card>
      </div>
    </div>
  )
}