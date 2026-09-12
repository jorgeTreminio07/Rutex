"use client"

import { PackageMinusIcon, PencilIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { usePaged } from "@/lib/use-paged"
import type { MermaDto } from "@/types/interfaces/merma.interface"

const PAGE_SIZE = 10

interface MermasMobileListProps {
  mermas: MermaDto[]
  onEdit: (merma: MermaDto) => void
  onDelete: (merma: MermaDto) => void
}

export function MermasMobileList({ mermas, onEdit, onDelete }: MermasMobileListProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(mermas, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((merma) => (
          <li key={merma.id}>
            <Card
              onClick={() => onEdit(merma)}
              className="flex cursor-pointer flex-row items-center gap-3 p-3"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <PackageMinusIcon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-mono text-sm font-medium">{merma.mermaNumber}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(merma.createdAt).toLocaleDateString("es-NI")}
                  </span>
                </div>
                <p className="truncate text-xs font-semibold text-destructive">
                  − {merma.totalUnits} uds · C$ {merma.totalValue.toFixed(2)}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Badge variant="secondary" className="max-w-36 text-[10px]">
                    <span className="truncate">{merma.motivoName}</span>
                  </Badge>
                </div>
              </div>
              <div className="flex shrink-0 items-center">
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
            </Card>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay mermas registradas.
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