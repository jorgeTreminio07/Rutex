"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { fmtMoney } from "@/lib/format"
import { usePaged } from "@/lib/use-paged"
import type { ProfitReportRow, ProfitReportSummary } from "@/types/interfaces/report.interface"

const PAGE_SIZE = 10

interface ProfitMobileListProps {
  rows: ProfitReportRow[]
  summary: ProfitReportSummary
}

export function ProfitMobileList({ rows, summary }: ProfitMobileListProps) {
  const { rows: pageRows, page, totalItems, pageSize, setPage } = usePaged(rows, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex items-center justify-between bg-muted/40 p-3">
        <span className="text-sm font-semibold">TOTAL</span>
        <span className="text-sm font-bold text-primary">{fmtMoney(summary.ganancia)}</span>
      </Card>

      <ul className="flex flex-col gap-2.5">
        {pageRows.map((row, index) => (
          <li key={`${row.orderNumber}-${row.productName}-${index}`} className="list-none">
            <Card className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{row.productName}</p>
                <Badge variant="outline" className="shrink-0 font-semibold text-[10px]">
                  {row.cantidad} uds
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">{formatFecha(row.fecha)} · {row.orderNumber ?? "—"}</span>
                <span className="shrink-0 font-semibold text-foreground">
                  {fmtMoney(row.ganancia)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Compra <span className="font-medium text-foreground">{fmtMoney(row.precioCompra)}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  Venta <span className="font-medium text-foreground">{fmtMoney(row.precioVenta)}</span>
                </span>
              </div>
            </Card>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No hay pedidos aprobados en el rango seleccionado.
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

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "short",
  })
}