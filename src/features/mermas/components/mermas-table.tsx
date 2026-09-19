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
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { fmtMoney } from "@/lib/format"
import { usePaged } from "@/lib/use-paged"
import type { MermaDto } from "@/types/interfaces/merma.interface"

const PAGE_SIZE = 10

interface MermasTableProps {
  mermas: MermaDto[]
  onEdit: (merma: MermaDto) => void
  onDelete: (merma: MermaDto) => void
}

export function MermasTable({ mermas, onEdit, onDelete }: MermasTableProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(mermas, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Merma</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead className="text-right">Unidades</TableHead>
            <TableHead className="text-right pr-6">Valor</TableHead>
            <TableHead className="w-16 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((merma) => (
            <TableRow key={merma.id} className="cursor-pointer" onClick={() => onEdit(merma)}>
              <TableCell>
                <div>
                  <span className="font-mono text-sm font-medium">{merma.mermaNumber}</span>
                  <p className="text-xs text-muted-foreground">
                    {new Date(merma.createdAt).toLocaleDateString("es-NI")}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="max-w-44">
                  <span className="truncate">{merma.motivoName}</span>
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {merma.items.length} {merma.items.length === 1 ? "producto" : "productos"}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">{merma.totalUnits}</TableCell>
              <TableCell className="text-right pr-6 font-semibold">
                {fmtMoney(merma.totalValue)}
              </TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(merma)
                    }}
                    aria-label={`Editar merma ${merma.mermaNumber}`}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(merma)
                    }}
                    aria-label={`Eliminar merma ${merma.mermaNumber}`}
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
                No hay mermas registradas.
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