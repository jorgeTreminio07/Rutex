"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DataTablePaginationProps {
  page: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

function buildPageItems(current: number, total: number): (number | "ellipsis")[] {
  const candidates = new Set([1, total, current - 1, current, current + 1])
  const sorted = [...candidates].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const items: (number | "ellipsis")[] = []
  let previous = 0
  for (const page of sorted) {
    if (page - previous > 1) items.push("ellipsis")
    items.push(page)
    previous = page
  }
  return items
}

export function DataTablePagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)
  const items = buildPageItems(page, totalPages)

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        {from}–{to} de {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeftIcon />
        </Button>
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${index}`} className="px-1 text-sm text-muted-foreground">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? "outline" : "ghost"}
              size="icon-sm"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              aria-label={`Ir a la página ${item}`}
              className={cn(item === page && "font-semibold")}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Página siguiente"
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  )
}