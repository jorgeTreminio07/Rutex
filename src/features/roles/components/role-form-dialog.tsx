"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { LockIcon } from "lucide-react"
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
import {
  isAdminRoleName,
  PERMISSION_MODULES,
  viewPermission,
} from "@/lib/permissions"
import { cn } from "@/lib/utils"
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

function CheckIcon({
  checked,
  disabled,
}: {
  checked: boolean
  disabled: boolean
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input",
        disabled && "opacity-40",
      )}
    >
      <svg
        viewBox="0 0 12 12"
        className={cn("size-3", !checked && "hidden")}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M2 6.5 5 9.5 10 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  isPending,
  onSubmit,
}: RoleFormDialogProps) {
  const isAdminLocked = Boolean(role && isAdminRoleName(role.name))

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { name: "", description: "", permissions: [] },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: role?.name ?? "",
        description: role?.description ?? "",
        permissions: isAdminLocked ? [] : (role?.permissions ?? []),
      })
    }
  }, [open, role, isAdminLocked, form])

  const permissions = form.watch("permissions")

  const isChecked = (key: string) => permissions.includes(key)

  const toggle = (key: string, checked: boolean) => {
    const current = form.getValues("permissions")
    form.setValue(
      "permissions",
      checked
        ? [...new Set([...current, key])]
        : current.filter((p) => p !== key),
      { shouldValidate: true },
    )
  }

  const toggleModuleView = (moduleKey: string, checked: boolean) => {
    const current = form.getValues("permissions")
    const moduleKeys = PERMISSION_MODULES.find((m) => m.key === moduleKey)
    const actionKeys = (moduleKeys?.actions ?? []).map((a) => `${moduleKey}:${a.key}`)
    const next = checked
      ? [...new Set([...current, viewPermission(moduleKey), ...actionKeys])]
      : current.filter(
          (p) => p !== viewPermission(moduleKey) && !actionKeys.includes(p),
        )
    form.setValue("permissions", next, { shouldValidate: true })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92dvh,920px)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{role ? "Editar rol" : "Nuevo rol"}</DialogTitle>
          <DialogDescription>
            {role
              ? "Actualiza los datos y permisos del rol."
              : "Registra un rol nuevo y elige qué puede hacer."}
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
              placeholder="ej. Vendedor"
              aria-invalid={!!form.formState.errors.name}
              disabled={isAdminLocked}
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
              disabled={isAdminLocked}
              {...form.register("description")}
            />
          </Field>

          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold">Permisos</Label>

            {isAdminLocked ? (
              <div className="flex items-start gap-2 rounded-xl border bg-muted/50 p-3 text-sm text-muted-foreground">
                <LockIcon className="mt-0.5 size-4 shrink-0" />
                El rol Admin tiene acceso total al sistema y no se puede
                editar.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {PERMISSION_MODULES.map((module) => {
                  const viewKey = viewPermission(module.key)
                  const viewOn = isChecked(viewKey)
                  return (
                    <div key={module.key} className="flex flex-col rounded-xl border">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={viewOn}
                        onClick={() => toggleModuleView(module.key, !viewOn)}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-accent/60"
                      >
                        <CheckIcon checked={viewOn} disabled={false} />
                        {module.label}
                        {module.actions.length === 0 && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            Acceso
                          </span>
                        )}
                      </button>

                      {module.actions.length > 0 && (
                        <div
                          className={cn(
                            "flex flex-wrap gap-2 px-3 pb-3 pl-9",
                            !viewOn && "pointer-events-none opacity-40",
                          )}
                        >
                          {module.actions.map((action) => {
                            const key = `${module.key}:${action.key}`
                            return (
                              <button
                                key={key}
                                type="button"
                                role="checkbox"
                                aria-checked={isChecked(key)}
                                disabled={!viewOn}
                                onClick={() => toggle(key, !isChecked(key))}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                                  isChecked(key) && viewOn
                                    ? "border-primary/40 bg-primary/10 text-primary"
                                    : "text-muted-foreground",
                                  !viewOn && "opacity-40",
                                )}
                              >
                                <CheckIcon checked={isChecked(key) && viewOn} disabled={!viewOn} />
                                {action.label}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || isAdminLocked}>
              {isAdminLocked ? (
                <>
                  <LockIcon />
                  Bloqueado
                </>
              ) : isPending ? (
                "Guardando…"
              ) : role ? (
                "Guardar cambios"
              ) : (
                "Crear rol"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}