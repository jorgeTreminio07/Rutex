"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Building2Icon,
  ChevronsUpDownIcon,
  Loader2Icon,
  ReceiptTextIcon,
  StoreIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
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
  compraSchema,
  type CompraFormValues,
} from "@/features/compras/validations/compra.schema"
import type { CompraDto } from "@/types/interfaces/compra.interface"
import type { SupplierDto } from "@/types/interfaces/supplier.interface"

export interface ReceiptInfo {
  path: string
  url: string
}

export interface CompraSubmitValues {
  title: string
  supplierId: string
  observation: string | null
  amount: number
  receiptPath: string | null
}

interface CompraFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  compra?: CompraDto | null
  suppliers: SupplierDto[]
  isPending: boolean
  isUploadingReceipt: boolean
  onUploadReceipt: (file: File, fallbackName: string) => Promise<ReceiptInfo>
  onSubmit: (values: CompraSubmitValues) => Promise<void>
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function CompraFormDialog({
  open,
  onOpenChange,
  compra,
  suppliers,
  isPending,
  isUploadingReceipt,
  onUploadReceipt,
  onSubmit,
}: CompraFormDialogProps) {
  const isEditing = Boolean(compra)
  const [supplierId, setSupplierId] = useState<string | null>(compra?.supplierId ?? null)
  const [supplierQuery, setSupplierQuery] = useState(compra?.supplierName ?? "")
  const [supplierOpen, setSupplierOpen] = useState(false)
  const [receipt, setReceipt] = useState<{ path: string | null; url: string | null }>({
    path: compra?.receiptPath ?? null,
    url: compra?.receiptUrl ?? null,
  })

  const form = useForm<CompraFormValues>({
    resolver: zodResolver(compraSchema),
    defaultValues: {
      title: compra?.title ?? "",
      observation: compra?.observation ?? "",
      amount: compra?.amount != null ? String(compra.amount) : "",
    },
  })

  const suppliersMatches = useMemo(() => {
    const q = supplierQuery.trim().toLowerCase()
    return suppliers.filter(
      (s) => `${s.name} ${s.ruc} ${s.phone}`.toLowerCase().includes(q),
    )
  }, [suppliers, supplierQuery])

  const chosenSupplier = supplierId ? suppliers.find((s) => s.id === supplierId) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar compra" : "Nueva compra"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(async (values) => {
            if (!supplierId) return
            await onSubmit({
              title: values.title,
              supplierId,
              observation: values.observation?.trim() || null,
              amount: Number(values.amount),
              receiptPath: receipt.path,
            })
          })}
          className="flex flex-col gap-4"
        >
          <Field
            label="Título de la compra *"
            htmlFor="compra-title"
            error={form.formState.errors.title?.message}
          >
            <Input
              id="compra-title"
              className="h-10 rounded-xl"
              placeholder="ej. Compra de mercadería, insumos…"
              aria-invalid={!!form.formState.errors.title}
              {...form.register("title")}
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="compra-supplier">Proveedor *</Label>
            <div className="relative">
              <StoreIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="compra-supplier"
                className="h-10 rounded-xl pl-9 pr-9"
                placeholder="Buscar un proveedor…"
                value={supplierQuery}
                aria-invalid={!supplierId}
                onChange={(e) => {
                  setSupplierQuery(e.target.value)
                  setSupplierId(null)
                  setSupplierOpen(true)
                }}
                onFocus={() => setSupplierOpen(true)}
                onBlur={() => setSupplierOpen(false)}
              />
              <ChevronsUpDownIcon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              {supplierOpen && suppliersMatches.length > 0 && (
                <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border bg-popover p-1 shadow-md">
                  {suppliersMatches.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSupplierId(s.id)
                          setSupplierQuery(s.name)
                          setSupplierOpen(false)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                      >
                        <Building2Icon className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{s.name}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {s.ruc} · {s.phone}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {!chosenSupplier && supplierQuery && (
              <p className="text-xs text-muted-foreground">
                {suppliersMatches.length === 0
                  ? "No hay proveedores que coincidan."
                  : "Selecciona un proveedor de la lista."}
              </p>
            )}
          </div>

          <Field
            label="Monto total (C$) *"
            htmlFor="compra-amount"
            error={form.formState.errors.amount?.message}
          >
            <Input
              id="compra-amount"
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
            label="Comentario / Descripción"
            htmlFor="compra-observation"
            error={form.formState.errors.observation?.message}
          >
            <Textarea
              id="compra-observation"
              className="rounded-xl"
              placeholder="Detalle de la compra (opcional)…"
              aria-invalid={!!form.formState.errors.observation}
              {...form.register("observation")}
            />
          </Field>

          <div className="flex flex-col gap-2">
            <Label>Recibo de compra (opcional)</Label>

            {receipt.path ? (
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={receipt.url ?? "#"}
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
                htmlFor="compra-receipt-file"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
              >
                {isUploadingReceipt ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <ReceiptTextIcon className="size-4" />
                )}
                {isUploadingReceipt ? "Subiendo recibo…" : "Subir recibo"}
                <input
                  id="compra-receipt-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf"
                  className="hidden"
                  disabled={isUploadingReceipt}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && !isUploadingReceipt) {
                      const title = form.getValues("title")
                      onUploadReceipt(file, title || "compra")
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
              Imagen o PDF, máximo 15 MB. Si lo quitas o borras la compra, el archivo se elimina
              del almacenamiento.
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
            <Button type="submit" disabled={isPending || isUploadingReceipt || !supplierId}>
              {isPending || isUploadingReceipt ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Guardando…
                </>
              ) : (
                <>{isEditing ? "Guardar cambios" : "Registrar compra"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}