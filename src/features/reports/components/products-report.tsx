"use client"

import { PackageSearchIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ReportToolbar } from "@/features/reports/components/report-toolbar"
import { SummaryCard } from "@/features/reports/components/summary-card"
import { useProductSalesReport } from "@/features/reports/hooks/use-reports"
import { useReportDateRange } from "@/features/reports/lib/date-range"
import { exportRowsToExcel } from "@/features/reports/lib/excel"
import { fmtMoney, rangeName } from "@/features/reports/lib/format"
import type { ProductSalesReportDto } from "@/types/interfaces/report.interface"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePaged } from "@/lib/use-paged"

const MONEY = "#,##0.00"
const PAGE_SIZE = 10

export function ProductsReport() {
  const { from, to, setFrom, setTo, today, monthStart, applyPreset } = useReportDateRange()
  const { data, isLoading, isFetching } = useProductSalesReport(from, to)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!data || data.rows.length === 0) return
    setIsExporting(true)
    try {
      await exportProductSales(data)
      toast.success("Archivo Excel descargado")
    } catch {
      toast.error("No se pudo generar el archivo Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const summary = data?.summary
  const footer = data ? `${data.rows.length} producto(s) · ${data.summary.unidades} unidades` : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageSearchIcon className="size-4 text-primary" />
          Ventas por producto
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Unidades, ingresos, costo y ganancia de cada producto en pedidos aprobados.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ReportToolbar
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
          onPreset={applyPreset}
          today={today}
          monthStart={monthStart}
          onExport={handleExport}
          isExporting={isExporting}
          canExport={Boolean(data && data.rows.length > 0)}
          isFetching={isFetching}
          footer={footer}
        />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard label="Productos" value={String(summary.productos)} />
            <SummaryCard label="Unidades" value={String(summary.unidades)} />
            <SummaryCard label="Ventas" value={fmtMoney(summary.ventas)} />
            <SummaryCard label="Ganancia" value={fmtMoney(summary.ganancia)} highlight />
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data && data.rows.length > 0 ? (
          <>
            <div className="hidden md:block">
              <ProductsTable dto={data} />
            </div>
            <div className="md:hidden">
              <ProductsMobileList dto={data} />
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No hay pedidos aprobados en el rango seleccionado.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ProductsTable({ dto }: { dto: ProductSalesReportDto }) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(dto.rows, PAGE_SIZE)
  const s = dto.summary
  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Producto</TableHead>
            <TableHead className="w-20 text-right">Unidades</TableHead>
            <TableHead className="w-32 text-right">Ventas</TableHead>
            <TableHead className="w-32 text-right">Costo</TableHead>
            <TableHead className="w-32 text-right">Ganancia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.productId ?? row.productName}>
              <TableCell>
                <span className="line-clamp-1 font-medium">{row.productName}</span>
              </TableCell>
              <TableCell className="text-right">{row.cantidad}</TableCell>
              <TableCell className="text-right">{fmtMoney(row.ventas)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{fmtMoney(row.costo)}</TableCell>
              <TableCell className="text-right font-semibold">{fmtMoney(row.ganancia)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-primary/30 bg-muted/50 font-semibold">
            <TableCell colSpan={4}>TOTAL</TableCell>
            <TableCell className="text-right text-primary">{fmtMoney(s.ganancia)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <DataTablePagination page={page} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}

function ProductsMobileList({ dto }: { dto: ProductSalesReportDto }) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(dto.rows, PAGE_SIZE)
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.productId ?? row.productName} className="list-none">
            <Card className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="line-clamp-1 text-sm font-medium">{row.productName}</p>
                <span className="shrink-0 font-semibold text-primary">{fmtMoney(row.ganancia)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{row.cantidad} uds</span>
                <span>
                  Ventas <span className="font-medium text-foreground">{fmtMoney(row.ventas)}</span>
                </span>
                <span>
                  Costo <span className="font-medium text-foreground">{fmtMoney(row.costo)}</span>
                </span>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <DataTablePagination page={page} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}

async function exportProductSales(dto: ProductSalesReportDto): Promise<void> {
  await exportRowsToExcel({
    sheetName: "Ventas por producto",
    filename: `ventas-por-producto-${rangeName(dto.from, dto.to)}.xlsx`,
    columns: [
      { header: "Producto", key: "productName", width: 42 },
      { header: "Unidades", key: "cantidad", width: 12, numFmt: "0.###" },
      { header: "Ventas", key: "ventas", width: 14, numFmt: MONEY },
      { header: "Costo", key: "costo", width: 14, numFmt: MONEY },
      { header: "Ganancia", key: "ganancia", width: 14, numFmt: MONEY },
    ],
    rows: dto.rows,
    totalRow: {
      productName: "TOTAL",
      cantidad: dto.summary.unidades,
      ventas: dto.summary.ventas,
      costo: dto.summary.costo,
      ganancia: dto.summary.ganancia,
    },
    totalLabel: "TOTAL",
  })
}