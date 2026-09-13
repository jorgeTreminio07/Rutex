"use client"

import { LockIcon, PencilIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { getStatusMeta } from "@/lib/statuses"
import { isAdminRoleName } from "@/lib/permissions"
import { usePaged } from "@/lib/use-paged"
import type { RoleDto } from "@/types/interfaces/user.interface"

const PAGE_SIZE = 10

interface RolesMobileListProps {
  roles: RoleDto[]
  onEdit: (role: RoleDto) => void
  onDelete: (role: RoleDto) => void
  canEdit: boolean
  canDelete: boolean
}

export function RolesMobileList({ roles, onEdit, onDelete, canEdit, canDelete }: RolesMobileListProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(roles, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((role) => {
          const status = getStatusMeta(role.statusId)
          const adminLock = isAdminRoleName(role.name)
          return (
            <li key={role.id}>
              <Card className="flex flex-row items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-medium">
                    {role.name}
                    {adminLock && <LockIcon className="size-3.5 text-muted-foreground" />}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {role.description ?? "Sin descripción"}
                  </p>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(role)}
                    disabled={adminLock || !canEdit}
                    aria-label={`Editar rol ${role.name}`}
                  >
                    {adminLock ? <LockIcon /> : <PencilIcon />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(role)}
                    disabled={adminLock || !canDelete}
                    aria-label={`Eliminar rol ${role.name}`}
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
            No hay roles registrados.
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