"use client"

import { PlusIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useRoles } from "@/features/roles/hooks/use-roles"
import { UserDeleteDialog } from "@/features/users/components/user-delete-dialog"
import { UserFormDialog } from "@/features/users/components/user-form-dialog"
import { UsersMobileList } from "@/features/users/components/users-mobile-list"
import { UsersTable } from "@/features/users/components/users-table"
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "@/features/users/hooks/use-users"
import type { UserFormValues } from "@/features/users/validations/user.schema"
import type { UserDto } from "@/types/interfaces/user.interface"

export function UsersView() {
  const { data: users = [], isLoading } = useUsers()
  const rolesQuery = useRoles()
  const roles = rolesQuery.data ?? []

  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<UserDto | null>(null)
  const [deleting, setDeleting] = useState<UserDto | null>(null)

  const handleCreate = async (values: UserFormValues) => {
    await createUser.mutateAsync({
      username: values.username,
      firstName: values.firstName || undefined,
      lastName: values.lastName || undefined,
      email: values.email || undefined,
      password: values.password || "",
      roleId: values.roleId,
      statusId: values.statusId,
      photo: values.photo,
      signature: values.signature,
    })
    setFormOpen(false)
  }

  const handleUpdate = async (values: UserFormValues) => {
    if (!editing) return
    await updateUser.mutateAsync({
      id: editing.id,
      payload: {
        username: values.username,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
        email: values.email || undefined,
        password: values.password || undefined,
        roleId: values.roleId,
        statusId: values.statusId,
        photo: values.photo,
        signature: values.signature,
        removeSignature: values.removeSignature,
      },
    })
    setFormOpen(false)
    setEditing(null)
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (user: UserDto) => {
    setEditing(user)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Gestiona los usuarios del sistema.</p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          Nuevo usuario
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <UsersTable users={users} onEdit={openEdit} onDelete={setDeleting} />
          </div>
          <div className="md:hidden">
            <UsersMobileList users={users} onEdit={openEdit} onDelete={setDeleting} />
          </div>
        </>
      )}

      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editing}
        roles={roles}
        isPending={createUser.isPending || updateUser.isPending}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <UserDeleteDialog
        user={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        isPending={deleteUser.isPending}
        onConfirm={async () => {
          if (!deleting) return
          await deleteUser.mutateAsync(deleting.id)
          setDeleting(null)
        }}
      />
    </div>
  )
}