"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CameraIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { STATUSES, getStatusMeta } from "@/lib/statuses"
import { getAssetUrl } from "@/lib/assets"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SignatureField } from "@/features/store/components/signature-field"
import {
  userFormSchema,
  type UserFormValues,
} from "@/features/users/validations/user.schema"
import type { RoleDto, UserDto } from "@/types/interfaces/user.interface"

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserDto | null
  roles: RoleDto[]
  isPending: boolean
  onSubmit: (values: UserFormValues) => Promise<void>
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

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  roles,
  isPending,
  onSubmit,
}: UserFormDialogProps) {
  const isEditing = Boolean(user)
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      roleId: "",
      statusId: STATUSES.ACTIVE,
      removeSignature: false,
    },
  })

  const roleId = useWatch({ control: form.control, name: "roleId" })
  const isMedico =
    roles.find((role) => role.id === roleId)?.name.trim().toLowerCase() === "medico"
  const existingSignature = user?.signatureUrl ? getAssetUrl(user.signatureUrl) : null

  const selectedPhoto = useWatch({ control: form.control, name: "photo" })
  const statusId = useWatch({ control: form.control, name: "statusId" })
  const signature = useWatch({ control: form.control, name: "signature" })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [prevPhoto, setPrevPhoto] = useState<File | null | undefined>(null)

  useEffect(() => {
    if (!open) return
    form.reset({
      username: user?.username ?? "",
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      email: user?.email ?? "",
      password: "",
      roleId: user?.role?.id ?? "",
      statusId: user?.statusId ?? STATUSES.ACTIVE,
      removeSignature: false,
    })
  }, [open, user, form])

  useEffect(() => {
    if (!isMedico) {
      form.setValue("signature", undefined)
      form.setValue("removeSignature", false)
    }
  }, [isMedico, form])

  if (selectedPhoto !== prevPhoto) {
    setPrevPhoto(selectedPhoto)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(selectedPhoto ? URL.createObjectURL(selectedPhoto) : null)
  }

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const existingImage = user?.imageUrl ? getAssetUrl(user.imageUrl) : null
  const preview = photoPreview ?? existingImage

  const submitValues = form.handleSubmit(async (values) => {
    if (!isEditing && !values.password) {
      form.setError("password", { type: "manual", message: "La contraseña es obligatoria" })
      return
    }
    await onSubmit(values)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100%-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
          {/* <DialogDescription>
            {isEditing ? "Actualiza los datos del usuario." : "Registra un usuario nuevo en el sistema."}
          </DialogDescription> */}
        </DialogHeader>

        <form onSubmit={submitValues} className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar size="xl">
              {preview ? <AvatarImage src={preview} alt="Foto de perfil" /> : null}
              <AvatarFallback>{user?.username?.slice(0, 2).toUpperCase() ?? "?"}</AvatarFallback>
            </Avatar>
            <label
              htmlFor="user-photo"
              className={cn(
                "flex flex-1 cursor-pointer flex-col rounded-xl border border-dashed p-3 text-sm transition-colors hover:bg-muted/50",
                form.formState.errors.photo && "border-destructive",
              )}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <CameraIcon className="size-4" />
                {isEditing ? "Cambiar foto de perfil" : "Subir foto de perfil"}
              </span>
              <span className="text-xs text-muted-foreground">
                PNG, JPG o WebP · máximo 5 MB
              </span>
            </label>
            <input
              id="user-photo"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                form.setValue("photo", file ?? undefined, { shouldValidate: true })
                event.target.value = ""
              }}
            />
          </div>

          {form.formState.errors.photo && (
            <p className="-mt-2 text-xs text-destructive">{form.formState.errors.photo.message}</p>
          )}

          {selectedPhoto && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start text-destructive hover:text-destructive"
              onClick={() => form.setValue("photo", undefined)}
            >
              <XIcon />
              Quitar imagen seleccionada
            </Button>
          )}

          <Field label="Usuario *" htmlFor="user-username" error={form.formState.errors.username?.message}>
            <Input
              id="user-username"
              className={inputClassName}
              placeholder="ej. jperez"
              aria-invalid={!!form.formState.errors.username}
              {...form.register("username")}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre" htmlFor="user-firstname" error={form.formState.errors.firstName?.message}>
              <Input
                id="user-firstname"
                className={inputClassName}
                placeholder="Juan"
                aria-invalid={!!form.formState.errors.firstName}
                {...form.register("firstName")}
              />
            </Field>
            <Field label="Apellido" htmlFor="user-lastname" error={form.formState.errors.lastName?.message}>
              <Input
                id="user-lastname"
                className={inputClassName}
                placeholder="Pérez"
                aria-invalid={!!form.formState.errors.lastName}
                {...form.register("lastName")}
              />
            </Field>
          </div>

          <Field label="Correo" htmlFor="user-email" error={form.formState.errors.email?.message}>
            <Input
              id="user-email"
              type="email"
              className={inputClassName}
              placeholder="correo@tienda.com"
              aria-invalid={!!form.formState.errors.email}
              {...form.register("email")}
            />
          </Field>

          <Field
            label={isEditing ? "Nueva contraseña (opcional)" : "Contraseña *"}
            htmlFor="user-password"
            error={form.formState.errors.password?.message}
          >
            <Input
              id="user-password"
              type="password"
              className={inputClassName}
              placeholder={isEditing ? "Dejar vacío para conservar" : "Mínimo 6 caracteres"}
              aria-invalid={!!form.formState.errors.password}
              {...form.register("password")}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Rol *" htmlFor="user-role" error={form.formState.errors.roleId?.message}>
              <Select
                value={roleId ?? ""}
                onValueChange={(value) => {
                  form.setValue("roleId", value ?? "", { shouldValidate: true })
                }}
              >
                <SelectTrigger id="user-role" aria-invalid={!!form.formState.errors.roleId}>
                  <SelectValue>
                    {(value) =>
                      value
                        ? roles.find((role) => role.id === value)?.name ?? value
                        : "Selecciona un rol"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    <SelectItemText>Selecciona un rol</SelectItemText>
                  </SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      <SelectItemText>{role.name}</SelectItemText>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Estado" htmlFor="user-status" error={form.formState.errors.statusId?.message}>
              <Select
                value={statusId ?? STATUSES.ACTIVE}
                onValueChange={(value) => {
                  form.setValue("statusId", (value ?? STATUSES.ACTIVE) as number)
                }}
              >
                <SelectTrigger id="user-status">
                  <SelectValue>
                    {(value) => getStatusMeta((value ?? STATUSES.ACTIVE) as number).label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={STATUSES.ACTIVE}>
                    <SelectItemText>Activo</SelectItemText>
                  </SelectItem>
                  <SelectItem value={STATUSES.INACTIVE}>
                    <SelectItemText>Inactivo</SelectItemText>
                  </SelectItem>
                  <SelectItem value={STATUSES.BLOCKED}>
                    <SelectItemText>Bloqueado</SelectItemText>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          {isMedico && (
            <SignatureField
              value={signature}
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
          )}

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
              {isPending ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}