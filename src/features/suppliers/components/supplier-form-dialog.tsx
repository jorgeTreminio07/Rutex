"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import type { ReactNode } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
  supplierSchema,
  type SupplierFormValues,
} from "@/features/suppliers/validations/supplier.schema"
import type { SupplierDto } from "@/types/interfaces/supplier.interface"

interface SupplierFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  supplier?: SupplierDto | null
  isPending: boolean
  onSubmit: (values: SupplierFormValues) => Promise<void>
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

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier,
  isPending,
  onSubmit,
}: SupplierFormDialogProps) {
  const isEditing = Boolean(supplier)

  const form = useForm<z.input<typeof supplierSchema>, unknown, z.output<typeof supplierSchema>>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier?.name ?? "",
      ruc: supplier?.ruc ?? "",
      phone: supplier?.phone ?? "",
      address: supplier?.address ?? "",
      ownerName: supplier?.ownerName ?? "",
      email: supplier?.email ?? "",
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(async (values) => {
            await onSubmit(values)
          })}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Nombre del proveedor *"
              htmlFor="supplier-name"
              error={form.formState.errors.name?.message}
            >
              <Input
                id="supplier-name"
                className="h-10 rounded-xl"
                placeholder="ej. Distribuidora XYZ"
                aria-invalid={!!form.formState.errors.name}
                {...form.register("name")}
              />
            </Field>

            <Field
              label="RUC *"
              htmlFor="supplier-ruc"
              error={form.formState.errors.ruc?.message}
            >
              <Input
                id="supplier-ruc"
                className="h-10 rounded-xl font-mono"
                placeholder="ej. J0310000123456"
                aria-invalid={!!form.formState.errors.ruc}
                {...form.register("ruc")}
              />
            </Field>
          </div>

          <Field
            label="Teléfono *"
            htmlFor="supplier-phone"
            error={form.formState.errors.phone?.message}
          >
            <Input
              id="supplier-phone"
              type="tel"
              className="h-10 rounded-xl"
              placeholder="ej. 8888 8888"
              aria-invalid={!!form.formState.errors.phone}
              {...form.register("phone")}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field
              label="Correo electrónico"
              htmlFor="supplier-email"
              error={form.formState.errors.email?.message}
            >
              <Input
                id="supplier-email"
                type="email"
                className="h-10 rounded-xl"
                placeholder="ej. ventas@distribuidora.com"
                aria-invalid={!!form.formState.errors.email}
                {...form.register("email")}
              />
            </Field>

            <Field
              label="Nombre del propietario"
              htmlFor="supplier-owner"
              error={form.formState.errors.ownerName?.message}
            >
              <Input
                id="supplier-owner"
                className="h-10 rounded-xl"
                placeholder="ej. Juan Pérez"
                aria-invalid={!!form.formState.errors.ownerName}
                {...form.register("ownerName")}
              />
            </Field>
          </div>

          <Field
            label="Dirección"
            htmlFor="supplier-address"
            error={form.formState.errors.address?.message}
          >
            <Textarea
              id="supplier-address"
              className="rounded-xl"
              placeholder="Describe la dirección del proveedor..."
              aria-invalid={!!form.formState.errors.address}
              {...form.register("address")}
            />
          </Field>

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
              {isPending ? (
                <>
                  <Loader2Icon className="animate-spin" />
                  Guardando…
                </>
              ) : (
                <>{isEditing ? "Guardar cambios" : "Crear proveedor"}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}