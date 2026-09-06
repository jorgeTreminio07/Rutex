"use client"

import { PencilIcon, Trash2Icon } from "lucide-react"

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
import { getStatusMeta } from "@/lib/statuses"
import { usePaged } from "@/lib/use-paged"
import type { RoleDto } from "@/types/interfaces/user.interface"

import { DataTablePagination } from "@/components/data-table/data-table-pagination"

const PAGE_SIZE = 10

interface RolesTableProps {
  roles: RoleDto[]
  onEdit: (role: RoleDto) => void
  onDelete: (role: RoleDto) => void
}

export function RolesTable({ roles, onEdit, onDelete }: RolesTableProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(roles, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="w-28">Estado</TableHead>
            <TableHead className="w-24 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((role) => {
            const status = getStatusMeta(role.statusId)
            return (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell className="max-w-64 truncate text-muted-foreground">
                  {role.description ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(role)}
                      aria-label={`Editar rol ${role.name}`}
                    >
                      <PencilIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(role)}
                      aria-label={`Eliminar rol ${role.name}`}
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
              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                No hay roles registrados.
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