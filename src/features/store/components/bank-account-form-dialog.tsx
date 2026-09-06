"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAssetUrl } from "@/lib/assets"
import { ImageUploadField } from "@/features/store/components/image-upload-field"
import {
  CURRENCY_OPTIONS,
  bankAccountFormSchema,
  type BankAccountFormValues,
} from "@/features/store/validations/store.schema"
import type { BankAccountDto } from "@/types/interfaces/store.interface"

interface BankAccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: BankAccountDto | null
  isPending: boolean
  onSubmit: (values: BankAccountFormValues) => Promise<void>
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

export function BankAccountFormDialog({
  open,
  onOpenChange,
  account,
  isPending,
  onSubmit,
}: BankAccountFormDialogProps) {
  const isEditing = Boolean(account)
  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      bankName: "",
      currency: "",
      accountNumber: "",
      lastFourDigits: "",
      accountHolder: "",
      qrCode: undefined,
      removeQr: false,
    },
  })

  const currency = useWatch({ control: form.control, name: "currency" }) ?? ""
  const lastFourDigits = useWatch({ control: form.control, name: "lastFourDigits" })
  const qrCode = useWatch({ control: form.control, name: "qrCode" })

  useEffect(() => {
    if (open) {
      form.reset({
        bankName: account?.bankName ?? "",
        currency: account?.currency ?? "",
        accountNumber: "",
        lastFourDigits: account?.lastFourDigits ?? "",
        accountHolder: account?.accountHolder ?? "",
        qrCode: undefined,
        removeQr: false,
      })
    }
  }, [open, account, form])

  const submitValues = form.handleSubmit(async (values) => {
    if (!isEditing && !(values.accountNumber ?? "").trim()) {
      form.setError("accountNumber", {
        type: "manual",
        message: "El número de cuenta es obligatorio",
      })
      return
    }
    await onSubmit(values)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar cuenta bancaria" : "Nueva cuenta bancaria"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los datos de la cuenta bancaria."
              : "Agrega una cuenta para recibir pagos."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submitValues} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Banco *" htmlFor="account-bank" error={form.formState.errors.bankName?.message}>
              <Input
                id="account-bank"
                className={inputClassName}
                placeholder="ej. BAC"
                aria-invalid={!!form.formState.errors.bankName}
                {...form.register("bankName")}
              />
            </Field>
            <Field label="Moneda *" htmlFor="account-currency" error={form.formState.errors.currency?.message}>
              <Select
                value={currency}
                onValueChange={(value) => {
                  form.setValue("currency", value ?? "", { shouldValidate: true })
                }}
              >
                <SelectTrigger id="account-currency" aria-invalid={!!form.formState.errors.currency}>
                  <SelectValue>
                    {(value) =>
                      CURRENCY_OPTIONS.find((option) => option.value === value)?.label ??
                      "Selecciona una moneda"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <SelectItemText>{option.label}</SelectItemText>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field
            label={isEditing ? "Número de cuenta" : "Número de cuenta *"}
            htmlFor="account-number"
            error={form.formState.errors.accountNumber?.message}
          >
            <Input
              id="account-number"
              className={inputClassName}
              placeholder={isEditing ? "Dejar vacío para conservar el actual" : "ej. 1234567890"}
              aria-invalid={!!form.formState.errors.accountNumber}
              {...form.register("accountNumber")}
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Actualmente •••• {lastFourDigits}. Si dejas el campo vacío se conserva.
              </p>
            )}
          </Field>

          <Field label="Titular *" htmlFor="account-holder" error={form.formState.errors.accountHolder?.message}>
            <Input
              id="account-holder"
              className={inputClassName}
              placeholder="ej. Juan Pérez"
              aria-invalid={!!form.formState.errors.accountHolder}
              {...form.register("accountHolder")}
            />
          </Field>

          <ImageUploadField
            id="account-qr"
            label="QR para recibir pagos (opcional)"
            hint="PNG, JPG o WebP · máximo 5 MB"
            accept="image/*"
            value={qrCode}
            existingUrl={account?.qrUrl ? getAssetUrl(account.qrUrl) : null}
            error={form.formState.errors.qrCode?.message}
            onSelect={(file) => {
              form.setValue("qrCode", file, { shouldValidate: true })
              form.setValue("removeQr", false)
            }}
            onRemove={() => {
              form.setValue("qrCode", undefined)
              form.setValue("removeQr", true)
            }}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Agregar cuenta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}