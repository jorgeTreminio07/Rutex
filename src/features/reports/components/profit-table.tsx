"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { usePaged } from "@/lib/use-paged"
import type { ProfitReportRow, ProfitReportSummary } from "@/types/interfaces/report.interface"

const PAGE_SIZE = 15

interface ProfitTableProps {
  rows: ProfitReportRow[]
  summary: ProfitReportSummary
}

export function ProfitTable({ rows, summary }: ProfitTableProps) {
  const { rows: pageRows, page, totalItems, pageSize, setPage } = usePaged(rows, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Fecha</TableHead>
            <TableHead className="w-36">Pedido</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead className="w-20 text-right">Cant.</TableHead>
            <TableHead className="w-28 text-right">P. Compra</TableHead>
            <TableHead className="w-28 text-right">P. Venta</TableHead>
            <TableHead className="w-32 text-right">Ganancia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((row, index) => {
            const changeDay = index === 0 || pageRows[index - 1]?.fecha !== row.fecha
            return (
              <TableRow key={`${row.orderNumber}-${row.productName}-${index}`}>
                <TableCell className="text-muted-foreground">
                  {changeDay ? formatFecha(row.fecha) : ""}
                </TableCell>
                <TableCell className="font-medium">{row.orderNumber ?? "—"}</TableCell>
                <TableCell>
                  <span className="line-clamp-1">{row.productName}</span>
                </TableCell>
                <TableCell className="text-right">{row.cantidad}</TableCell>
                <TableCell className="text-right">{fmtMoney(row.precioCompra)}</TableCell>
                <TableCell className="text-right">{fmtMoney(row.precioVenta)}</TableCell>
                <TableCell className="text-right font-semibold">{fmtMoney(row.ganancia)}</TableCell>
              </TableRow>
            )
          })}
          {rows.length > 0 && (
            <TableRow className="border-t-2 border-primary/30 bg-muted/50 font-semibold">
              <TableCell colSpan={3}>TOTAL</TableCell>
              <TableCell className="text-right">{summary.unidades}</TableCell>
              <TableCell className="text-right">{fmtMoney(summary.costo)}</TableCell>
              <TableCell className="text-right">{fmtMoney(summary.ventas)}</TableCell>
              <TableCell className="text-right text-primary">{fmtMoney(summary.ganancia)}</TableCell>
            </TableRow>
          )}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No hay pedidos aprobados en el rango seleccionado.
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

function formatFecha(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function fmtMoney(value: number): string {
  return `C$ ${value.toFixed(2)}`
}