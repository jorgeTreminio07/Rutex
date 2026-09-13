"use client"

import { Clock3Icon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ReportToolbar } from "@/features/reports/components/report-toolbar"
import { SummaryCard } from "@/features/reports/components/summary-card"
import { useHourSalesReport } from "@/features/reports/hooks/use-reports"
import { useReportDateRange } from "@/features/reports/lib/date-range"
import { exportRowsToExcel } from "@/features/reports/lib/excel"
import { fmtHora, fmtMoney, rangeName } from "@/features/reports/lib/format"
import type { HourSalesReportDto } from "@/types/interfaces/report.interface"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePaged } from "@/lib/use-paged"

const MONEY = "#,##0.00"
const PAGE_SIZE = 12

export function HoursReport() {
  const { from, to, setFrom, setTo, today, monthStart, applyPreset } = useReportDateRange()
  const { data, isLoading, isFetching } = useHourSalesReport(from, to)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!data || data.rows.length === 0) return
    setIsExporting(true)
    try {
      await exportHourSales(data)
      toast.success("Archivo Excel descargado")
    } catch {
      toast.error("No se pudo generar el archivo Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const summary = data?.summary
  const footer = data ? `${data.summary.pedidos} pedido(s) · ventas ${fmtMoney(data.summary.ventas)}` : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3Icon className="size-4 text-primary" />
          Horario de compras
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          A qué horas del día se concentran las ventas (hora de Nicaragua).
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
            <SummaryCard label="Pedidos" value={String(summary.pedidos)} />
            <SummaryCard label="Ventas" value={fmtMoney(summary.ventas)} />
            <SummaryCard label="Horas con venta" value={String(data?.rows.length ?? 0)} />
            <SummaryCard
              label="Horario pico"
              value={summary.horarioPico !== null ? fmtHora(summary.horarioPico) : "—"}
              highlight
            />
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
              <HoursTable dto={data} />
            </div>
            <div className="md:hidden">
              <HoursMobileList dto={data} />
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

function HoursTable({ dto }: { dto: HourSalesReportDto }) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(dto.rows, PAGE_SIZE)
  const maxPedidos = Math.max(1, ...rows.map((row) => row.pedidos))
  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Hora</TableHead>
            <TableHead className="w-40">Pedidos</TableHead>
            <TableHead className="w-40 text-right">Ventas</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.hora}>
              <TableCell className="font-medium">{fmtHora(row.hora)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="w-6 text-right">{row.pedidos}</span>
                  <div className="h-2 flex-1 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary/70"
                      style={{ width: `${Math.round((row.pedidos / maxPedidos) * 100)}%` }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">{fmtMoney(row.ventas)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-primary/30 bg-muted/50 font-semibold">
            <TableCell colSpan={2}>TOTAL</TableCell>
            <TableCell className="text-right text-primary">{fmtMoney(dto.summary.ventas)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <DataTablePagination page={page} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}

function HoursMobileList({ dto }: { dto: HourSalesReportDto }) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(dto.rows, PAGE_SIZE)
  const maxPedidos = Math.max(1, ...dto.rows.map((row) => row.pedidos))
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.hora} className="list-none">
            <Card className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{fmtHora(row.hora)}</span>
                <span className="text-sm font-semibold text-primary">{fmtMoney(row.ventas)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-8 text-xs text-muted-foreground">{row.pedidos} pedido(s)</span>
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary/70"
                    style={{ width: `${Math.round((row.pedidos / maxPedidos) * 100)}%` }}
                  />
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <DataTablePagination page={page} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}

async function exportHourSales(dto: HourSalesReportDto): Promise<void> {
  await exportRowsToExcel({
    sheetName: "Horario de compras",
    filename: `horario-de-compras-${rangeName(dto.from, dto.to)}.xlsx`,
    columns: [
      { header: "Hora", key: "hora", width: 12 },
      { header: "Pedidos", key: "pedidos", width: 12, numFmt: "0" },
      { header: "Ventas", key: "ventas", width: 14, numFmt: MONEY },
    ],
    rows: dto.rows.map((row) => ({ ...row, hora: fmtHora(row.hora) })),
    totalRow: {
      hora: "TOTAL",
      pedidos: dto.summary.pedidos,
      ventas: dto.summary.ventas,
    },
    totalLabel: "TOTAL",
  })
}