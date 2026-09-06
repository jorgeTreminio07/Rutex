"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import type { ReactNode } from "react"

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
import { Textarea } from "@/components/ui/textarea"
import {
  roleFormSchema,
  type RoleFormValues,
} from "@/features/roles/validations/rol.schema"
import type { RoleDto } from "@/types/interfaces/user.interface"

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: RoleDto | null
  isPending: boolean
  onSubmit: (values: RoleFormValues) => Promise<void>
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

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  isPending,
  onSubmit,
}: RoleFormDialogProps) {
  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { name: "", description: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: role?.name ?? "",
        description: role?.description ?? "",
      })
    }
  }, [open, role, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{role ? "Editar rol" : "Nuevo rol"}</DialogTitle>
          <DialogDescription>
            {role ? "Actualiza los datos del rol." : "Registra un rol nuevo en el sistema."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field
            label="Nombre"
            htmlFor="role-name"
            error={form.formState.errors.name?.message}
          >
            <Input
              id="role-name"
              className="h-10 rounded-xl"
              placeholder="ej. Médico"
              aria-invalid={!!form.formState.errors.name}
              {...form.register("name")}
            />
          </Field>

          <Field
            label="Descripción"
            htmlFor="role-description"
            error={form.formState.errors.description?.message}
          >
            <Textarea
              id="role-description"
              placeholder="Descripción del rol"
              aria-invalid={!!form.formState.errors.description}
              {...form.register("description")}
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
              {isPending ? "Guardando…" : role ? "Guardar cambios" : "Crear rol"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}