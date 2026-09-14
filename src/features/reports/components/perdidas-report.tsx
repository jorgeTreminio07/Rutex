"use client"

import { TrendingDownIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { ReportToolbar } from "@/features/reports/components/report-toolbar"
import { SummaryCard } from "@/features/reports/components/summary-card"
import { usePerdidaReport } from "@/features/reports/hooks/use-reports"
import { useReportDateRange } from "@/features/reports/lib/date-range"
import { exportRowsToExcel } from "@/features/reports/lib/excel"
import { fmtMoney, rangeName } from "@/features/reports/lib/format"
import { usePaged } from "@/lib/use-paged"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { PerdidaReportDto } from "@/types/interfaces/report.interface"

const MONEY = "#,##0.00"
const QUANTITY = "0.###"
const PAGE_SIZE = 15
const MOBILE_PAGE_SIZE = 10

export function PerdidasReport() {
  const { from, to, setFrom, setTo, today, monthStart, applyPreset } = useReportDateRange()
  const { data, isLoading, isFetching } = usePerdidaReport(from, to)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!data || data.rows.length === 0) {
      toast.info("No hay datos para exportar en el rango seleccionado")
      return
    }
    setIsExporting(true)
    try {
      await exportPerdidas(data)
      toast.success("Archivo Excel descargado")
    } catch {
      toast.error("No se pudo generar el archivo Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const summary = data?.summary
  const footer = data ? `${data.rows.length} producto(s) mermado(s) · ${summary?.mermas} merma(s)` : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDownIcon className="size-4 text-primary" />
          Pérdidas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pérdida económica por mermas, línea por producto: costo real y valor de venta perdido.
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
            <SummaryCard label="Unidades perdidas" value={String(summary.unidades)} />
            <SummaryCard label="Pérdida al costo" value={fmtMoney(summary.costoPerdido)} highlight />
            <SummaryCard label="Valor de venta perdido" value={fmtMoney(summary.valorVentaPerdido)} />
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
              <PerdidasTable dto={data} />
            </div>
            <div className="md:hidden">
              <PerdidasMobileList dto={data} />
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No hay pérdidas por mermas en el rango seleccionado.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PerdidasTable({ dto }: { dto: PerdidaReportDto }) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(dto.rows, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Fecha</TableHead>
            <TableHead className="w-32">Nº merma</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead className="w-20 text-right">Cant.</TableHead>
            <TableHead className="w-28 text-right">Costo perdido</TableHead>
            <TableHead className="w-28 text-right">Valor venta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const changeDay = index === 0 || rows[index - 1]?.fecha !== row.fecha
            return (
              <TableRow key={`${row.mermaNumber}-${row.producto}-${index}`}>
                <TableCell className="text-muted-foreground">
                  {changeDay ? fmtDate(row.fecha) : ""}
                </TableCell>
                <TableCell className="font-medium">{row.mermaNumber ?? "—"}</TableCell>
                <TableCell>
                  <span className="line-clamp-1">{row.producto}</span>
                </TableCell>
                <TableCell>
                  <span className="line-clamp-1 text-muted-foreground">{row.motivo}</span>
                </TableCell>
                <TableCell className="text-right">{row.cantidad}</TableCell>
                <TableCell className="text-right">{fmtMoney(row.costoPerdido)}</TableCell>
                <TableCell className="text-right">{fmtMoney(row.valorVentaPerdido)}</TableCell>
              </TableRow>
            )
          })}
          <TableRow className="border-t-2 border-primary/30 bg-muted/50 font-semibold">
            <TableCell colSpan={4}>TOTAL</TableCell>
            <TableCell className="text-right">{dto.summary.unidades}</TableCell>
            <TableCell className="text-right text-primary">{fmtMoney(dto.summary.costoPerdido)}</TableCell>
            <TableCell className="text-right">{fmtMoney(dto.summary.valorVentaPerdido)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <DataTablePagination page={page} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}

function PerdidasMobileList({ dto }: { dto: PerdidaReportDto }) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(dto.rows, MOBILE_PAGE_SIZE)

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex items-center justify-between bg-muted/40 p-3">
        <span className="text-sm font-semibold">PÉRDIDA</span>
        <span className="text-sm font-bold text-primary">{fmtMoney(dto.summary.costoPerdido)}</span>
      </Card>
      <ul className="flex flex-col gap-2.5">
        {rows.map((row, index) => (
          <li key={`${row.mermaNumber}-${row.producto}-${index}`} className="list-none">
            <Card className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium">{row.producto}</p>
                <span className="shrink-0 text-sm font-semibold text-primary">
                  {fmtMoney(row.costoPerdido)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">
                  {fmtDate(row.fecha)} · {row.mermaNumber ?? "—"}
                </span>
                <span className="shrink-0">{row.cantidad} uds</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{row.motivo}</span>
                <span className="shrink-0">
                  Venta <span className="font-medium text-foreground">{fmtMoney(row.valorVentaPerdido)}</span>
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

async function exportPerdidas(dto: PerdidaReportDto): Promise<void> {
  await exportRowsToExcel({
    sheetName: "Pérdidas",
    filename: `perdidas-${rangeName(dto.from, dto.to)}.xlsx`,
    columns: [
      { header: "Fecha", key: "fecha", width: 14 },
      { header: "Nº merma", key: "mermaNumber", width: 20 },
      { header: "Producto", key: "producto", width: 40 },
      { header: "Motivo", key: "motivo", width: 30 },
      { header: "Cantidad", key: "cantidad", width: 12, numFmt: QUANTITY },
      { header: "Pérdida al costo", key: "costoPerdido", width: 15, numFmt: MONEY },
      { header: "Valor de venta perdido", key: "valorVentaPerdido", width: 17, numFmt: MONEY },
    ],
    rows: dto.rows,
    totalRow: {
      fecha: "",
      mermaNumber: "",
      producto: "TOTAL",
      motivo: "",
      cantidad: dto.summary.unidades,
      costoPerdido: dto.summary.costoPerdido,
      valorVentaPerdido: dto.summary.valorVentaPerdido,
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