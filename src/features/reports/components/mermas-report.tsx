"use client"

import { PackageXIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { ReportToolbar } from "@/features/reports/components/report-toolbar"
import { SummaryCard } from "@/features/reports/components/summary-card"
import { useMermaReport } from "@/features/reports/hooks/use-reports"
import { useReportDateRange } from "@/features/reports/lib/date-range"
import { exportRowsToExcel } from "@/features/reports/lib/excel"
import { fmtMoney, rangeName } from "@/features/reports/lib/format"
import { usePaged } from "@/lib/use-paged"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { MermaReportDto } from "@/types/interfaces/report.interface"

const MONEY = "#,##0.00"
const QUANTITY = "0.###"
const PAGE_SIZE = 15
const MOBILE_PAGE_SIZE = 10

export function MermasReport() {
  const { from, to, setFrom, setTo, today, monthStart, applyPreset } = useReportDateRange()
  const { data, isLoading, isFetching } = useMermaReport(from, to)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!data || data.rows.length === 0) {
      toast.info("No hay datos para exportar en el rango seleccionado")
      return
    }
    setIsExporting(true)
    try {
      await exportMermas(data)
      toast.success("Archivo Excel descargado")
    } catch {
      toast.error("No se pudo generar el archivo Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const summary = data?.summary
  const footer = data ? `${data.rows.length} merma(s) · unidades ${summary?.unidades}` : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageXIcon className="size-4 text-primary" />
          Mermas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Bajas de stock del período: unidades, costo y valor a precio de venta.
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
            <SummaryCard label="Mermas" value={String(summary.mermas)} />
            <SummaryCard label="Unidades" value={String(summary.unidades)} />
            <SummaryCard label="Costo mermado" value={fmtMoney(summary.costo)} />
            <SummaryCard label="Valor a venta" value={fmtMoney(summary.valorVenta)} highlight />
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
              <MermasTable dto={data} />
            </div>
            <div className="md:hidden">
              <MermasMobileList dto={data} />
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No hay mermas en el rango seleccionado.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function MermasTable({ dto }: { dto: MermaReportDto }) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(dto.rows, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Fecha</TableHead>
            <TableHead className="w-32">Nº merma</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead className="w-20 text-right">Unid.</TableHead>
            <TableHead className="w-28 text-right">Costo</TableHead>
            <TableHead className="w-28 text-right">Valor venta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const changeDay = index === 0 || rows[index - 1]?.fecha !== row.fecha
            return (
              <TableRow key={row.mermaNumber ?? `${row.fecha}-${index}`}>
                <TableCell className="text-muted-foreground">
                  {changeDay ? fmtDate(row.fecha) : ""}
                </TableCell>
                <TableCell className="font-medium">{row.mermaNumber ?? "—"}</TableCell>
                <TableCell>
                  <span className="line-clamp-1">{row.motivo}</span>
                </TableCell>
                <TableCell className="text-right">{row.unidades}</TableCell>
                <TableCell className="text-right">{fmtMoney(row.costo)}</TableCell>
                <TableCell className="text-right">{fmtMoney(row.valorVenta)}</TableCell>
              </TableRow>
            )
          })}
          <TableRow className="border-t-2 border-primary/30 bg-muted/50 font-semibold">
            <TableCell colSpan={3}>TOTAL</TableCell>
            <TableCell className="text-right">{dto.summary.unidades}</TableCell>
            <TableCell className="text-right">{fmtMoney(dto.summary.costo)}</TableCell>
            <TableCell className="text-right text-primary">{fmtMoney(dto.summary.valorVenta)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <DataTablePagination page={page} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}

function MermasMobileList({ dto }: { dto: MermaReportDto }) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(dto.rows, MOBILE_PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex items-center justify-between bg-muted/40 p-3">
        <span className="text-sm font-semibold">TOTAL</span>
        <span className="text-sm font-bold text-primary">{fmtMoney(dto.summary.valorVenta)}</span>
      </Card>
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.mermaNumber ?? row.fecha} className="list-none">
            <Card className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{row.motivo}</p>
                <span className="shrink-0 text-sm font-semibold">{fmtMoney(row.valorVenta)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">
                  {fmtDate(row.fecha)} · {row.mermaNumber ?? "—"}
                </span>
                <span className="shrink-0">{row.unidades} uds</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
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

async function exportMermas(dto: MermaReportDto): Promise<void> {
  await exportRowsToExcel({
    sheetName: "Mermas",
    filename: `mermas-${rangeName(dto.from, dto.to)}.xlsx`,
    columns: [
      { header: "Fecha", key: "fecha", width: 14 },
      { header: "Nº merma", key: "mermaNumber", width: 20 },
      { header: "Motivo", key: "motivo", width: 30 },
      { header: "Unidades", key: "unidades", width: 12, numFmt: QUANTITY },
      { header: "Costo", key: "costo", width: 14, numFmt: MONEY },
      { header: "Valor venta", key: "valorVenta", width: 14, numFmt: MONEY },
    ],
    rows: dto.rows,
    totalRow: {
      fecha: "",
      mermaNumber: "",
      motivo: "TOTAL",
      unidades: dto.summary.unidades,
      costo: dto.summary.costo,
      valorVenta: dto.summary.valorVenta,
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