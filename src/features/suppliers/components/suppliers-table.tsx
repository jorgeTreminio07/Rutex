"use client"

import { CheckCircle2Icon, PencilIcon, Trash2Icon } from "lucide-react"

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
import { usePaged } from "@/lib/use-paged"
import type { SupplierDto } from "@/types/interfaces/supplier.interface"

const PAGE_SIZE = 10

interface SuppliersTableProps {
  suppliers: SupplierDto[]
  onEdit: (supplier: SupplierDto) => void
  onDelete: (supplier: SupplierDto) => void
}

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  )
}

export function SuppliersTable({ suppliers, onEdit, onDelete }: SuppliersTableProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(suppliers, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Proveedor</TableHead>
            <TableHead>RUC</TableHead>
            <TableHead className="hidden lg:table-cell">Dirección</TableHead>
            <TableHead className="hidden lg:table-cell">Propietario</TableHead>
            <TableHead className="hidden md:table-cell">Correo</TableHead>
            <TableHead className="w-20 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((supplier) => (
            <TableRow key={supplier.id} className="cursor-pointer" onClick={() => onEdit(supplier)}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {initials(supplier.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{supplier.name}</p>
                    <p className="text-xs text-muted-foreground">{supplier.phone}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {supplier.ruc}
              </TableCell>
              <TableCell className="hidden max-w-56 lg:table-cell">
                <p className="truncate text-muted-foreground">{supplier.address ?? "—"}</p>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                {supplier.ownerName ?? "—"}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {supplier.email ? (
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="size-3.5 text-primary" />
                    <span className="truncate">{supplier.email}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(supplier)
                    }}
                    aria-label={`Editar proveedor ${supplier.name}`}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(supplier)
                    }}
                    aria-label={`Eliminar proveedor ${supplier.name}`}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No hay proveedores registrados.
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