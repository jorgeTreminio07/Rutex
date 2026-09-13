"use client"

import { PackageXIcon } from "lucide-react"

import type { DashboardStockBajoRow } from "@/types/interfaces/report.interface"

interface Props {
  data: DashboardStockBajoRow[]
}

const STOCK_BAJO_LIMIT = 5

export function StockBajoList({ data }: Props) {
  const maxStock = Math.max(STOCK_BAJO_LIMIT, ...data.map((row) => row.stock), 1)

  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <PackageXIcon className="size-8 opacity-40" />
        Ningún producto con stock bajo.
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.map((row) => (
        <li key={row.producto} className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">{row.producto}</span>
            <span
              className={
                row.stock === 0
                  ? "font-semibold text-destructive"
                  : "font-semibold text-primary"
              }
            >
              {row.stock}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className={
                row.stock === 0
                  ? "h-2 rounded-full bg-destructive"
                  : "h-2 rounded-full bg-primary/70"
              }
              style={{ width: `${Math.min(100, Math.max(6, (row.stock / maxStock) * 100))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}