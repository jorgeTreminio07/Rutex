"use client"

import { PencilIcon, ReceiptTextIcon, StoreIcon, Trash2Icon } from "lucide-react"

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
import type { CompraDto } from "@/types/interfaces/compra.interface"

const PAGE_SIZE = 10

interface ComprasTableProps {
  compras: CompraDto[]
  onEdit: (compra: CompraDto) => void
  onDelete: (compra: CompraDto) => void
}

export function ComprasTable({ compras, onEdit, onDelete }: ComprasTableProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(compras, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Compra</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead className="hidden md:table-cell">Fecha</TableHead>
            <TableHead className="hidden lg:table-cell">Recibo</TableHead>
            <TableHead className="w-32 text-right">Monto</TableHead>
            <TableHead className="w-20 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((compra) => (
            <TableRow key={compra.id} className="cursor-pointer" onClick={() => onEdit(compra)}>
              <TableCell>
                <div className="min-w-0">
                  <p className="truncate font-medium">{compra.title}</p>
                  {compra.observation && (
                    <p className="truncate text-xs text-muted-foreground">{compra.observation}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {compra.supplierName ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <StoreIcon className="size-3.5 text-primary" />
                    <span className="truncate">{compra.supplierName}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {compra.createdAt ? formatDate(compra.createdAt) : "—"}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {compra.receiptUrl ? (
                  <a
                    href={compra.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ReceiptTextIcon className="size-3.5" />
                    Ver recibo
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right pr-6 font-semibold">
                C$ {compra.amount.toFixed(2)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(compra)
                    }}
                    aria-label={`Editar compra ${compra.title}`}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(compra)
                    }}
                    aria-label={`Eliminar compra ${compra.title}`}
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
                No hay compras registradas.
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}