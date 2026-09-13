"use client"

import { LockIcon, PencilIcon, Trash2Icon } from "lucide-react"

import { UserAvatar } from "@/components/layout/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { getStatusMeta } from "@/lib/statuses"
import { usePaged } from "@/lib/use-paged"
import type { UserDto } from "@/types/interfaces/user.interface"

const PAGE_SIZE = 10

function isAdminLockedUser(user: UserDto): boolean {
  return user.username.toLowerCase() === "admin"
}

interface UsersTableProps {
  users: UserDto[]
  onEdit: (user: UserDto) => void
  onDelete: (user: UserDto) => void
}

function fullName(user: UserDto): string {
  const parts = [user.firstName, user.lastName].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : "—"
}

export function UsersTable({ users, onEdit, onDelete }: UsersTableProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(users, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="w-28">Estado</TableHead>
            <TableHead className="w-24 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((user) => {
            const status = getStatusMeta(user.statusId)
            const adminLock = isAdminLockedUser(user)
            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <UserAvatar user={user} size="lg" />
                    <span className="flex items-center gap-1.5 font-medium">
                      {user.username}
                      {adminLock && <LockIcon className="size-3.5 text-muted-foreground" />}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{fullName(user)}</TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  {user.email ?? "—"}
                </TableCell>
                <TableCell>{user.role?.name ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(user)}
                      disabled={adminLock}
                      aria-label={`Editar usuario ${user.username}`}
                    >
                      {adminLock ? <LockIcon /> : <PencilIcon />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(user)}
                      disabled={adminLock}
                      aria-label={`Eliminar usuario ${user.username}`}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No hay usuarios registrados.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <DataTablePagination
        page={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  )
}