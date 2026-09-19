"use client"

import { MessageSquareQuoteIcon, PencilIcon, ReceiptTextIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { fmtMoney } from "@/lib/format"
import { usePaged } from "@/lib/use-paged"
import type { GastoDto } from "@/types/interfaces/gasto.interface"

const PAGE_SIZE = 10

interface GastosMobileListProps {
  gastos: GastoDto[]
  onEdit: (gasto: GastoDto) => void
  onDelete: (gasto: GastoDto) => void
}

export function GastosMobileList({ gastos, onEdit, onDelete }: GastosMobileListProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(gastos, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((gasto) => (
          <li key={gasto.id} className="list-none">
            <Card
              onClick={() => onEdit(gasto)}
              className="flex cursor-pointer flex-row items-center gap-3 p-3"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ReceiptTextIcon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{gasto.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(gasto.createdAt)}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="font-semibold text-[10px]">
                    {fmtMoney(gasto.amount)}
                  </Badge>
                  {gasto.observation && (
                    <Badge variant="outline" className="max-w-40 text-[10px]">
                      <MessageSquareQuoteIcon className="size-3 shrink-0" />
                      <span className="truncate">{gasto.observation}</span>
                    </Badge>
                  )}
                  {gasto.receiptUrl && (
                    <Badge variant="outline" className="text-primary text-[10px]">
                      <ReceiptTextIcon className="size-3" />
                      Recibo
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
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
            </Card>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay gastos registrados.
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}