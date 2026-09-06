"use client"

import { PlusIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
import type { RoleDto } from "@/types/interfaces/user.interface"

export function RolesView() {
  const { data: roles = [], isLoading } = useRoles()
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const deleteRole = useDeleteRole()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RoleDto | null>(null)
  const [deleting, setDeleting] = useState<RoleDto | null>(null)

  const handleCreate = async (values: RoleFormValues) => {
    await createRole.mutateAsync({
      name: values.name,
      description: values.description || undefined,
      statusId: STATUSES.ACTIVE,
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
    setEditing(role)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Roles</h1>
          <p className="text-sm text-muted-foreground">Gestiona los roles del sistema.</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Nuevo rol
        </Button>
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
            <RolesTable roles={roles} onEdit={openEdit} onDelete={setDeleting} />
          </div>
          <div className="md:hidden">
            <RolesMobileList roles={roles} onEdit={openEdit} onDelete={setDeleting} />
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
  )
}