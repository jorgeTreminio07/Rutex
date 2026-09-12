"use client"

import { PencilIcon, ReceiptTextIcon, Trash2Icon } from "lucide-react"

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
import type { GastoDto } from "@/types/interfaces/gasto.interface"

const PAGE_SIZE = 10

interface GastosTableProps {
  gastos: GastoDto[]
  onEdit: (gasto: GastoDto) => void
  onDelete: (gasto: GastoDto) => void
}

export function GastosTable({ gastos, onEdit, onDelete }: GastosTableProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(gastos, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Gasto</TableHead>
            <TableHead className="hidden md:table-cell">Fecha</TableHead>
            <TableHead className="hidden lg:table-cell">Recibo</TableHead>
            <TableHead className="w-32 text-right">Monto</TableHead>
            <TableHead className="w-20 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((gasto) => (
            <TableRow key={gasto.id} className="cursor-pointer" onClick={() => onEdit(gasto)}>
              <TableCell>
                <div className="min-w-0">
                  <p className="truncate font-medium">{gasto.title}</p>
                  {gasto.observation && (
                    <p className="truncate text-xs text-muted-foreground">{gasto.observation}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                {gasto.createdAt ? formatDate(gasto.createdAt) : "—"}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {gasto.receiptUrl ? (
                  <a
                    href={gasto.receiptUrl}
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
                C$ {gasto.amount.toFixed(2)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(gasto)
                    }}
                    aria-label={`Editar gasto ${gasto.title}`}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(gasto)
                    }}
                    aria-label={`Eliminar gasto ${gasto.title}`}
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No hay gastos registrados.
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