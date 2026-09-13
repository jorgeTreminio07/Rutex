"use client"

import { PlusIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PermissionGate } from "@/components/permissions/permission-gate"
import { usePermissions } from "@/features/auth/hooks/use-permissions"
import { RoleDeleteDialog } from "@/features/roles/components/role-delete-dialog"
import { RoleFormDialog } from "@/features/roles/components/role-form-dialog"
import { RolesMobileList } from "@/features/roles/components/roles-mobile-list"
import { RolesTable } from "@/features/roles/components/roles-table"
import {
  useCreateRole,
  useDeleteRole,
  useRoles,
  useUpdateRole,
} from "@/features/roles/hooks/use-roles"
import type { RoleFormValues } from "@/features/roles/validations/rol.schema"
import { STATUSES } from "@/lib/statuses"
import { isAdminRoleName } from "@/lib/permissions"
import type { RoleDto } from "@/types/interfaces/user.interface"

export function RolesView() {
  const { data: roles = [], isLoading } = useRoles()
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const deleteRole = useDeleteRole()
  const permissions = usePermissions()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RoleDto | null>(null)
  const [deleting, setDeleting] = useState<RoleDto | null>(null)

  const handleCreate = async (values: RoleFormValues) => {
    await createRole.mutateAsync({
      name: values.name,
      description: values.description || undefined,
      statusId: STATUSES.ACTIVE,
      permissions: values.permissions,
    })
    setFormOpen(false)
  }

  const handleUpdate = async (values: RoleFormValues) => {
    if (!editing) return
    await updateRole.mutateAsync({
      id: editing.id,
      payload: {
        name: values.name,
        description: values.description || undefined,
        statusId: editing.statusId,
        permissions: values.permissions,
      },
    })
    setFormOpen(false)
    setEditing(null)
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (role: RoleDto) => {
    if (isAdminRoleName(role.name)) return
    setEditing(role)
    setFormOpen(true)
  }

  const openDelete = (role: RoleDto) => {
    if (isAdminRoleName(role.name)) return
    setDeleting(role)
  }

  return (
    <PermissionGate moduleKey="roles">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Roles</h1>
            <p className="text-sm text-muted-foreground">Gestiona los roles del sistema.</p>
          </div>
          {permissions.has("roles:crear") && (
            <Button onClick={openCreate}>
              <PlusIcon />
              Nuevo rol
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <RolesTable
                roles={roles}
                onEdit={openEdit}
                onDelete={openDelete}
                canEdit={permissions.has("roles:editar")}
                canDelete={permissions.has("roles:eliminar")}
              />
            </div>
            <div className="md:hidden">
              <RolesMobileList
                roles={roles}
                onEdit={openEdit}
                onDelete={openDelete}
                canEdit={permissions.has("roles:editar")}
                canDelete={permissions.has("roles:eliminar")}
              />
            </div>
          </>
        )}

        <RoleFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          role={editing}
          isPending={createRole.isPending || updateRole.isPending}
          onSubmit={editing ? handleUpdate : handleCreate}
        />

        <RoleDeleteDialog
          role={deleting}
          onOpenChange={(open) => {
            if (!open) setDeleting(null)
          }}
          isPending={deleteRole.isPending}
          onConfirm={async () => {
            if (!deleting) return
            await deleteRole.mutateAsync(deleting.id)
            setDeleting(null)
          }}
        />
      </div>
    </PermissionGate>
  )
}