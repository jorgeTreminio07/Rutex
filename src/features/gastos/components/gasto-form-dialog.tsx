"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, ReceiptTextIcon } from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  gastoSchema,
  type GastoFormValues,
} from "@/features/gastos/validations/gasto.schema"
import type { GastoDto } from "@/types/interfaces/gasto.interface"

export interface GastoSubmitValues {
  title: string
  observation: string | null
  amount: number
  receiptPath: string | null
}

export interface ReceiptInfo {
  path: string
  url: string
}

interface GastoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  gasto?: GastoDto | null
  isPending: boolean
  isUploadingReceipt: boolean
  onUploadReceipt: (file: File, fallbackName: string) => Promise<ReceiptInfo>
  onSubmit: (values: GastoSubmitValues) => Promise<void>
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function GastoFormDialog({
  open,
  onOpenChange,
  gasto,
  isPending,
  isUploadingReceipt,
  onUploadReceipt,
  onSubmit,
}: GastoFormDialogProps) {
  const isEditing = Boolean(gasto)
  const [receipt, setReceipt] = useState<{ path: string | null; url: string | null }>({
    path: gasto?.receiptPath ?? null,
    url: gasto?.receiptUrl ?? null,
  })

  const form = useForm<GastoFormValues>({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      title: gasto?.title ?? "",
      observation: gasto?.observation ?? "",
      amount: gasto?.amount != null ? String(gasto.amount) : "",
    },
  })

  const receiptUrl = receipt.path ? (receipt.url ?? "#") : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar gasto" : "Nuevo gasto"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit({
              title: values.title,
              observation: values.observation?.trim() || null,
              amount: Number(values.amount),
              receiptPath: receipt.path,
            })
          })}
          className="flex flex-col gap-4"
        >
          <Field
            label="Título del gasto *"
            htmlFor="gasto-title"
            error={form.formState.errors.title?.message}
          >
            <Input
              id="gasto-title"
              className="h-10 rounded-xl"
              placeholder="ej. Papelería, luz, internet…"
              aria-invalid={!!form.formState.errors.title}
              {...form.register("title")}
            />
          </Field>

          <Field
            label="Monto (C$) *"
            htmlFor="gasto-amount"
            error={form.formState.errors.amount?.message}
          >
            <Input
              id="gasto-amount"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              className="h-10 rounded-xl"
              placeholder="0.00"
              aria-invalid={!!form.formState.errors.amount}
              {...form.register("amount")}
            />
          </Field>

          <Field
            label="Comentario"
            htmlFor="gasto-observation"
            error={form.formState.errors.observation?.message}
          >
            <Textarea
              id="gasto-observation"
              className="rounded-xl"
              placeholder="Detalle del gasto (opcional)…"
              aria-invalid={!!form.formState.errors.observation}
              {...form.register("observation")}
            />
          </Field>

          <div className="flex flex-col gap-2">
            <Label>Recibo del gasto (opcional)</Label>

            {receipt.path ? (
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={receiptUrl ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
                >
                  <ReceiptTextIcon className="size-4 text-primary" />
                  Ver recibo
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 rounded-xl px-3"
                  disabled={isUploadingReceipt}
                  onClick={() => setReceipt({ path: null, url: null })}
                >
                  Quitar recibo
                </Button>
              </div>
            ) : (
              <label
                htmlFor="gasto-receipt-file"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
              >
                {isUploadingReceipt ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <ReceiptTextIcon className="size-4" />
                )}
                {isUploadingReceipt ? "Subiendo recibo…" : "Subir recibo"}
                <input
                  id="gasto-receipt-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf"
                  className="hidden"
                  disabled={isUploadingReceipt}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && !isUploadingReceipt) {
                      const title = form.getValues("title")
                      onUploadReceipt(file, title || "gasto")
                        .then((info) => setReceipt(info))
                        .catch(() => {
                          // el toast de error ya lo muestra la vista
                        })
                    }
                    e.target.value = ""
                  }}
                />
              </label>
            )}
            <p className="text-xs text-muted-foreground">
              Imagen o PDF, máximo 15 MB. Si lo quitas o borras el gasto, el archivo se elimina del
              almacenamiento.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending || isUploadingReceipt}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || isUploadingReceipt}>
              {isPending || isUploadingReceipt ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Guardando…
                </>
              ) : (
                <>{isEditing ? "Guardar cambios" : "Registrar gasto"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}