"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getAssetUrl } from "@/lib/assets"
import { cn } from "@/lib/utils"
import { ImageUploadField } from "@/features/store/components/image-upload-field"
import { SignatureField } from "@/features/store/components/signature-field"
import {
  storeFormSchema,
  type StoreFormValues,
} from "@/features/store/validations/store.schema"
import type { StoreProfileDto } from "@/types/interfaces/store.interface"

interface StoreFormProps {
  store?: StoreProfileDto
  isPending: boolean
  onSubmit: (values: StoreFormValues) => Promise<void>
}

const inputClassName =
  "h-10 rounded-xl aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function StoreForm({ store, isPending, onSubmit }: StoreFormProps) {
  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      ownerName: "",
      ruc: "",
      email: "",
      address: "",
      phone: "",
      workingHours: "",
      paymentPlansEnabled: true,
    },
  })

  const selectedLogo = useWatch({ control: form.control, name: "logo" })
  const selectedStamp = useWatch({ control: form.control, name: "stamp" })
  const selectedSignature = useWatch({ control: form.control, name: "signature" })
  const paymentPlansEnabled = useWatch({ control: form.control, name: "paymentPlansEnabled" })

  useEffect(() => {
    if (store) {
      form.reset({
        name: store.name ?? "",
        ownerName: store.ownerName ?? "",
        ruc: store.ruc ?? "",
        email: store.email ?? "",
        address: store.address ?? "",
        phone: store.phone ?? "",
        workingHours: store.workingHours ?? "",
        paymentPlansEnabled: store.paymentPlansEnabled ?? true,
      })
    }
  }, [store, form])

  const existingLogo = store?.logoUrl ? getAssetUrl(store.logoUrl) : null
  const existingStamp = store?.stampUrl ? getAssetUrl(store.stampUrl) : null
  const existingSignature = store?.signatureUrl ? getAssetUrl(store.signatureUrl) : null

  const submitValues = form.handleSubmit(async (values) => {
    await onSubmit(values)
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de la tienda</CardTitle>
      </CardHeader>

      <form onSubmit={submitValues} className="flex flex-col">
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ImageUploadField
              id="store-logo"
              label="Logo"
              hint="PNG, JPG o WebP · máximo 5 MB"
              accept="image/*"
              value={selectedLogo}
              existingUrl={existingLogo}
              error={form.formState.errors.logo?.message}
              onSelect={(file) => {
                form.setValue("logo", file, { shouldValidate: true })
                form.setValue("removeLogo", false)
              }}
              onRemove={() => {
                form.setValue("logo", undefined)
                form.setValue("removeLogo", true)
              }}
            />
            <ImageUploadField
              id="store-stamp"
              label="Sello"
              hint="PNG · máximo 5 MB"
              accept="image/png"
              value={selectedStamp}
              existingUrl={existingStamp}
              error={form.formState.errors.stamp?.message}
              onSelect={(file) => {
                form.setValue("stamp", file, { shouldValidate: true })
                form.setValue("removeStamp", false)
              }}
              onRemove={() => {
                form.setValue("stamp", undefined)
                form.setValue("removeStamp", true)
              }}
            />
            <SignatureField
              value={selectedSignature}
              existingUrl={existingSignature}
              error={form.formState.errors.signature?.message}
              onSelect={(file) => {
                form.setValue("signature", file, { shouldValidate: true })
                form.setValue("removeSignature", false)
              }}
              onRemove={() => {
                form.setValue("signature", undefined)
                form.setValue("removeSignature", true)
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre de la tienda *" htmlFor="store-name" error={form.formState.errors.name?.message}>
              <Input
                id="store-name"
                className={inputClassName}
                placeholder="ej. Mi Tienda"
                aria-invalid={!!form.formState.errors.name}
                {...form.register("name")}
              />
            </Field>
            <Field label="Nombre del propietario" htmlFor="store-owner" error={form.formState.errors.ownerName?.message}>
              <Input
                id="store-owner"
                className={inputClassName}
                placeholder="ej. Juan Pérez"
                aria-invalid={!!form.formState.errors.ownerName}
                {...form.register("ownerName")}
              />
            </Field>
            <Field label="RUC" htmlFor="store-ruc" error={form.formState.errors.ruc?.message}>
              <Input
                id="store-ruc"
                className={inputClassName}
                placeholder="J000000000"
                aria-invalid={!!form.formState.errors.ruc}
                {...form.register("ruc")}
              />
            </Field>
            <Field label="Correo electrónico" htmlFor="store-email" error={form.formState.errors.email?.message}>
              <Input
                id="store-email"
                type="email"
                className={inputClassName}
                placeholder="contacto@tienda.com"
                aria-invalid={!!form.formState.errors.email}
                {...form.register("email")}
              />
            </Field>
            <Field label="Teléfono" htmlFor="store-phone" error={form.formState.errors.phone?.message}>
              <Input
                id="store-phone"
                className={inputClassName}
                placeholder="+505 8888 8888"
                aria-invalid={!!form.formState.errors.phone}
                {...form.register("phone")}
              />
            </Field>
          </div>

          <Field label="Dirección" htmlFor="store-address" error={form.formState.errors.address?.message}>
            <Textarea
              id="store-address"
              aria-invalid={!!form.formState.errors.address}
              {...form.register("address")}
            />
          </Field>

          <Field label="Horario de atención" htmlFor="store-hours" error={form.formState.errors.workingHours?.message}>
            <Textarea
              id="store-hours"
              aria-invalid={!!form.formState.errors.workingHours}
              placeholder="ej. Lunes a viernes, 8:00 am – 5:00 pm"
              {...form.register("workingHours")}
            />
          </Field>

          <div className="flex items-start justify-between gap-4 rounded-xl border p-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="store-payment-plans" className="text-sm font-semibold">
                Permitir pagos en cuotas
              </Label>
              <p className="text-xs text-muted-foreground">
                Si está desactivado, los pedidos solo podrán pagarse de contado
                (se ocultan las opciones de 2 quincenales y 4 semanales).
              </p>
            </div>
            <button
              type="button"
              id="store-payment-plans"
              role="switch"
              aria-checked={paymentPlansEnabled}
              aria-label="Permitir pagos en cuotas"
              onClick={() =>
                form.setValue("paymentPlansEnabled", !paymentPlansEnabled, {
                  shouldValidate: true,
                })
              }
              className={cn(
                "inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border p-0.5 transition-colors outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring",
                paymentPlansEnabled
                  ? "border-transparent bg-primary"
                  : "border-border bg-input/50",
              )}
            >
              <span
                className={cn(
                  "size-6 rounded-full bg-background shadow-sm transition-transform duration-300 ease-in-out",
                  paymentPlansEnabled ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}