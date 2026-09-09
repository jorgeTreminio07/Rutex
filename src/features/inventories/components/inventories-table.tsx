"use client"

import { PencilIcon } from "lucide-react"

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
import { usePaged } from "@/lib/use-paged"
import type { InventoryDto } from "@/types/interfaces/inventory.interface"

const PAGE_SIZE = 10

interface InventoriesTableProps {
  inventories: InventoryDto[]
  onEdit: (inventory: InventoryDto) => void
}

export function InventoriesTable({ inventories, onEdit }: InventoriesTableProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(inventories, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Inventario</TableHead>
            <TableHead>Productos</TableHead>
            <TableHead className="text-right">Unidades</TableHead>
            <TableHead className="text-right pr-6">Valor inventario</TableHead>
            <TableHead className="w-14 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((inventory) => (
            <TableRow key={inventory.id} className="cursor-pointer" onClick={() => onEdit(inventory)}>
              <TableCell>
                <div>
                  <span className="font-mono text-sm font-medium">{inventory.inventoryNumber}</span>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inventory.createdAt).toLocaleDateString("es-NI")}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {inventory.items.length} {inventory.items.length === 1 ? "producto" : "productos"}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">{inventory.totalUnits}</TableCell>
              <TableCell className="text-right pr-6 font-semibold">C$ {inventory.totalValue.toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(inventory)
                    }}
                    aria-label={`Editar inventario ${inventory.inventoryNumber}`}
                  >
                    <PencilIcon />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                No hay inventarios registrados.
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