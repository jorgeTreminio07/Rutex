"use client"

import {
  MessageSquareQuoteIcon,
  PencilIcon,
  ReceiptTextIcon,
  StoreIcon,
  Trash2Icon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { usePaged } from "@/lib/use-paged"
import type { CompraDto } from "@/types/interfaces/compra.interface"

const PAGE_SIZE = 10

interface ComprasMobileListProps {
  compras: CompraDto[]
  onEdit: (compra: CompraDto) => void
  onDelete: (compra: CompraDto) => void
}

export function ComprasMobileList({ compras, onEdit, onDelete }: ComprasMobileListProps) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(compras, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((compra) => (
          <li key={compra.id} className="list-none">
            <Card
              onClick={() => onEdit(compra)}
              className="flex cursor-pointer flex-row items-center gap-3 p-3"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                {compra.supplierName ? (
                  <StoreIcon className="size-5" />
                ) : (
                  <ReceiptTextIcon className="size-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{compra.title}</p>
                <p className="text-xs text-muted-foreground">{formatDate(compra.createdAt)}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="font-semibold text-[10px]">
                    C$ {compra.amount.toFixed(2)}
                  </Badge>
                  {compra.supplierName && (
                    <Badge variant="outline" className="max-w-40 text-[10px]">
                      <StoreIcon className="size-3 shrink-0" />
                      <span className="truncate">{compra.supplierName}</span>
                    </Badge>
                  )}
                  {compra.observation && (
                    <Badge variant="outline" className="max-w-40 text-[10px]">
                      <MessageSquareQuoteIcon className="size-3 shrink-0" />
                      <span className="truncate">{compra.observation}</span>
                    </Badge>
                  )}
                  {compra.receiptUrl && (
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
            </Card>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay compras registradas.
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