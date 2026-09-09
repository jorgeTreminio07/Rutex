"use client"

import { BoxesIcon, PencilIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { usePaged } from "@/lib/use-paged"
import type { InventoryDto } from "@/types/interfaces/inventory.interface"

const PAGE_SIZE = 10

interface InventoriesMobileListProps {
  inventories: InventoryDto[]
  onEdit: (inventory: InventoryDto) => void
}

export function InventoriesMobileList({ inventories, onEdit }: InventoriesMobileListProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(inventories, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((inventory) => (
          <li key={inventory.id}>
            <Card
              onClick={() => onEdit(inventory)}
              className="flex cursor-pointer flex-row items-center gap-3 p-3"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <BoxesIcon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-mono text-sm font-medium">{inventory.inventoryNumber}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(inventory.createdAt).toLocaleDateString("es-NI")}
                  </span>
                </div>
                <p className="text-xs font-semibold">Valor: C$ {inventory.totalValue.toFixed(2)}</p>
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {inventory.items.length} {inventory.items.length === 1 ? "producto" : "productos"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{inventory.totalUnits} uds</span>
                </div>
              </div>
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
            </Card>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay inventarios registrados.
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