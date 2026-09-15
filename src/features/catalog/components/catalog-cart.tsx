"use client"

import { CreditCardIcon, MinusIcon, PhoneIcon, PlusIcon, SendIcon, ShoppingBagIcon, Trash2Icon, UserIcon } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"

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
} from "@/features/catalog/lib/whatsapp"
import { OrderActionDialog } from "@/features/orders/components/order-action-dialog"
import { useCreateOrder } from "@/features/orders/hooks/use-orders"
import { uploadProformaRequest } from "@/features/catalog/api/catalog.api"
import type { CartLine } from "@/features/catalog/store/use-cart-store"
import type { OrderDto, PaymentType } from "@/types/interfaces/order.interface"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface CatalogCartProps {
  items: CartLine[]
  storeName: string
  storePhone: string | null
  bankAccounts: BankAccountInfo[]
  paymentPlansEnabled: boolean
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
  paymentPlansEnabled,
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
  const [errors, setErrors] = useState<{ name?: boolean; phone?: boolean }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<OrderDto | null>(null)
  const router = useRouter()

  const total = cartTotal(items)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  const paymentOptions: [PaymentType, string, string][] = [
    ["contado", "De contado", `1 pago de C$ ${total.toFixed(2)}`],
    ...(paymentPlansEnabled
      ? ([
          ["cuotas_2", "2 pagos quincenales", `2x C$ ${(total / 2).toFixed(2)}`],
          ["cuotas_4", "4 pagos semanales", `4x C$ ${(total / 4).toFixed(2)}`],
        ] satisfies [PaymentType, string, string][])
      : []),
  ]

  const normalizedCustomerName = customerName.trim().toUpperCase()
  const validName = normalizedCustomerName.length > 2
  const validPhone = customerPhone.trim().length >= 8

  const handlePlaceOrder = async () => {
    const nextErrors: { name?: boolean; phone?: boolean } = {}
    if (!validName) nextErrors.name = true
    if (!validPhone) nextErrors.phone = true
    setErrors(nextErrors)
    if (nextErrors.name || nextErrors.phone || isSubmitting) return

    setIsSubmitting(true)
    try {
      const orderItems = cartToOrderItems(items)
      const order = await createOrder.mutateAsync({
        customerName: normalizedCustomerName,
        customerPhone: customerPhone.trim(),
        items: orderItems,
        total,
        paymentType,
      })

      if (isAuthenticated) {
        let proformaUrl = order?.proformaUrl ?? null

        // Si el servidor no pudo generar/guardar la proforma, generarla aquí
        // para no abrir el diálogo sin ella.
        if (!proformaUrl) {
          const pdf = generateProformaPdf({
            storeName,
            storePhone,
            customerName: normalizedCustomerName,
            customerPhone: customerPhone.trim(),
            orderNumber: order?.orderNumber ?? null,
            items: orderItems,
            total,
            paymentType,
            bankAccounts,
          })

          const blob = new Blob([pdf.output("blob")], { type: "application/pdf" })
          const uploaded = await uploadProformaRequest(
            blob,
            normalizedCustomerName.replace(/\s+/g, "-"),
          )
          proformaUrl = uploaded.url
        }

        const orderWithProforma = order ? { ...order, proformaUrl } : order
        setCreatedOrder(orderWithProforma)
      } else {
        window.open(
          generateOrderWhatsAppUrl({
            customerName: normalizedCustomerName,
            customerPhone: customerPhone.trim(),
            items: orderItems,
            total,
            orderNumber: order?.orderNumber ?? undefined,
            paymentType,
            targetPhoneNumber: storePhone ?? undefined,
          }),
          "_blank",
          "noopener,noreferrer",
        )
        onClear()
        router.push("/catalogo")
      }
    } catch {
      toast.error("No se pudo completar el pedido. Intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
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
    <>
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
                    <Image src={product.images[0]} alt={product.name} width={64} height={64} className="h-full w-full object-cover" />
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
                    disabled={quantity >= Math.floor(product.stock)}
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
                onChange={(e) => {
                  setCustomerName(e.target.value)
                  setErrors((prev) => ({ ...prev, name: false }))
                }}
                placeholder="Ej. Juan Pérez"
                className="h-10 rounded-xl"
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-xs text-destructive">Ingresa tu nombre completo.</p>}
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
                onChange={(e) => {
                  setCustomerPhone(e.target.value)
                  setErrors((prev) => ({ ...prev, phone: false }))
                }}
                placeholder="Ej. 123456789"
                className="h-10 rounded-xl"
                aria-invalid={!!errors.phone}
              />
              {errors.phone && <p className="text-xs text-destructive">Ingresa un teléfono válido (mínimo 8 dígitos).</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cc-payment">
                <CreditCardIcon className="mr-1 inline size-3.5" />
                Modalidad de pago
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {paymentOptions.map(([value, label, detail]) => (
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

          <Button className="w-full gap-2" size="lg" onClick={handlePlaceOrder}>
            <SendIcon className="size-4" />
            {isSubmitting ? "Procesando…" : isAuthenticated ? "Agregar pedido" : "Pedir por WhatsApp"}
          </Button>

          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            {isAuthenticated ? (
              <>Al hacer clic se registrará el pedido y se generará la proforma; luego podrás enviarla por WhatsApp o imprimir el recibo.</>
            ) : (
              <>Al hacer clic se registrará tu pedido y se abrirá WhatsApp para enviar la solicitud al{storePhone ? ` +${storePhone}` : " equipo"} de {storeName}.</>
            )}
          </p>
        </Card>
      </div>
      </div>

      <OrderActionDialog
        open={createdOrder !== null}
        onOpenChange={(open) => {
          if (!open) setCreatedOrder(null)
        }}
        order={createdOrder}
        onComplete={() => {
          setCreatedOrder(null)
          onClear()
          router.push("/catalogo")
        }}
      />
    </>
  )
}