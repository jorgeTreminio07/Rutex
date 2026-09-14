"use client"

import { ShoppingCartIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { ReportToolbar } from "@/features/reports/components/report-toolbar"
import { SummaryCard } from "@/features/reports/components/summary-card"
import { useCompraReport } from "@/features/reports/hooks/use-reports"
import { useReportDateRange } from "@/features/reports/lib/date-range"
import { exportRowsToExcel } from "@/features/reports/lib/excel"
import { fmtMoney, rangeName } from "@/features/reports/lib/format"
import { usePaged } from "@/lib/use-paged"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CompraReportDto } from "@/types/interfaces/report.interface"

const MONEY = "#,##0.00"
const PAGE_SIZE = 15
const MOBILE_PAGE_SIZE = 10

export function ComprasReport() {
  const { from, to, setFrom, setTo, today, monthStart, applyPreset } = useReportDateRange()
  const { data, isLoading, isFetching } = useCompraReport(from, to)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!data || data.rows.length === 0) {
      toast.info("No hay datos para exportar en el rango seleccionado")
      return
    }
    setIsExporting(true)
    try {
      await exportCompras(data)
      toast.success("Archivo Excel descargado")
    } catch {
      toast.error("No se pudo generar el archivo Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const summary = data?.summary
  const footer = data ? `${data.rows.length} compra(s) · total ${fmtMoney(data.summary.total)}` : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCartIcon className="size-4 text-primary" />
          Compras
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compras a proveedores en el período, con su monto y proveedor.
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
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <SummaryCard label="Compras" value={String(summary.compras)} />
            <SummaryCard label="Total comprado" value={fmtMoney(summary.total)} highlight />
            <SummaryCard label="Proveedores" value={String(summary.proveedores)} />
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
              <ComprasTable dto={data} />
            </div>
            <div className="md:hidden">
              <ComprasMobileList dto={data} />
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No hay compras en el rango seleccionado.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ComprasTable({ dto }: { dto: CompraReportDto }) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(dto.rows, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Fecha</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead className="w-32 text-right">Monto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const changeDay = index === 0 || rows[index - 1]?.fecha !== row.fecha
            return (
              <TableRow key={`${row.fecha}-${row.titulo}-${index}`}>
                <TableCell className="text-muted-foreground">
                  {changeDay ? fmtDate(row.fecha) : ""}
                </TableCell>
                <TableCell>
                  <span className="line-clamp-1 font-medium">{row.titulo}</span>
                </TableCell>
                <TableCell>
                  <span className="line-clamp-1 text-muted-foreground">{row.proveedor ?? "—"}</span>
                </TableCell>
                <TableCell className="text-right">{fmtMoney(row.monto)}</TableCell>
              </TableRow>
            )
          })}
          <TableRow className="border-t-2 border-primary/30 bg-muted/50 font-semibold">
            <TableCell colSpan={3}>TOTAL</TableCell>
            <TableCell className="text-right text-primary">{fmtMoney(dto.summary.total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <DataTablePagination page={page} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}

function ComprasMobileList({ dto }: { dto: CompraReportDto }) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(dto.rows, MOBILE_PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex items-center justify-between bg-muted/40 p-3">
        <span className="text-sm font-semibold">TOTAL</span>
        <span className="text-sm font-bold text-primary">{fmtMoney(dto.summary.total)}</span>
      </Card>
      <ul className="flex flex-col gap-2.5">
        {rows.map((row, index) => (
          <li key={`${row.fecha}-${row.titulo}-${index}`} className="list-none">
            <Card className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{row.titulo}</p>
                <span className="shrink-0 text-sm font-semibold">{fmtMoney(row.monto)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {fmtDate(row.fecha)}
                {row.proveedor ? ` · ${row.proveedor}` : ""}
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <DataTablePagination page={page} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}

async function exportCompras(dto: CompraReportDto): Promise<void> {
  await exportRowsToExcel({
    sheetName: "Compras",
    filename: `compras-${rangeName(dto.from, dto.to)}.xlsx`,
    columns: [
      { header: "Fecha", key: "fecha", width: 14 },
      { header: "Título", key: "titulo", width: 40 },
      { header: "Proveedor", key: "proveedor", width: 30 },
      { header: "Monto", key: "monto", width: 14, numFmt: MONEY },
    ],
    rows: dto.rows,
    totalRow: {
      fecha: "",
      titulo: "TOTAL",
      proveedor: "",
      monto: dto.summary.total,
    },
    totalLabel: "TOTAL",
  })
}

function fmtDate(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}