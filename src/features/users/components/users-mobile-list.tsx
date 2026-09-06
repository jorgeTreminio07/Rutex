"use client"

import { PencilIcon, Trash2Icon } from "lucide-react"

import { UserAvatar } from "@/components/layout/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { getStatusMeta } from "@/lib/statuses"
import { usePaged } from "@/lib/use-paged"
import type { UserDto } from "@/types/interfaces/user.interface"

const PAGE_SIZE = 10

interface UsersMobileListProps {
  users: UserDto[]
  onEdit: (user: UserDto) => void
  onDelete: (user: UserDto) => void
}

function fullName(user: UserDto): string {
  const parts = [user.firstName, user.lastName].filter(Boolean)
  return parts.length > 0 ? parts.join(" ") : "Sin nombre"
}

export function UsersMobileList({ users, onEdit, onDelete }: UsersMobileListProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(users, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((user) => {
          const status = getStatusMeta(user.statusId)
          return (
            <li key={user.id}>
              <Card className="flex flex-row items-center gap-3 p-3">
                <UserAvatar user={user} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{user.username}</p>
                  <p className="truncate text-sm text-muted-foreground">{fullName(user)}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary">{user.role?.name ?? "Sin rol"}</Badge>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(user)}
                    aria-label={`Editar usuario ${user.username}`}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(user)}
                    aria-label={`Eliminar usuario ${user.username}`}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </Card>
            </li>
          )
        })}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay usuarios registrados.
          </li>
        )}
      </ul>
      <DataTablePagination
        page={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </div>
  )
}