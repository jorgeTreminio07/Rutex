"use client"

import { PieChartIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { ReportToolbar } from "@/features/reports/components/report-toolbar"
import { SummaryCard } from "@/features/reports/components/summary-card"
import { useResumenReport } from "@/features/reports/hooks/use-reports"
import { useReportDateRange } from "@/features/reports/lib/date-range"
import { exportRowsToExcel } from "@/features/reports/lib/excel"
import { fmtMoney, rangeName } from "@/features/reports/lib/format"
import { usePaged } from "@/lib/use-paged"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ResumenReportDto } from "@/types/interfaces/report.interface"

const MONEY = "#,##0.00"
const PAGE_SIZE = 15
const MOBILE_PAGE_SIZE = 7

interface LineaConcepto {
  concepto: string
  valor: number
  tipo: "ingreso" | "resta" | "subtotal" | "total" | "info"
}

export function ResumenReport() {
  const { from, to, setFrom, setTo, today, monthStart, applyPreset } = useReportDateRange()
  const { data, isLoading, isFetching } = useResumenReport(from, to)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!data) return
    setIsExporting(true)
    try {
      await exportResumen(data)
      toast.success("Archivo Excel descargado")
    } catch {
      toast.error("No se pudo generar el archivo Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const summary = data?.summary
  const footer = data
    ? `${data.summary.pedidos} pedido(s) · neta ${fmtMoney(data.summary.gananciaNeta)}`
    : undefined

  const lineas: LineaConcepto[] = summary
    ? [
        { concepto: "Ventas", valor: summary.ventas, tipo: "ingreso" },
        { concepto: "Costo de venta", valor: -summary.costo, tipo: "resta" },
        { concepto: "Ganancia bruta", valor: summary.gananciaBruta, tipo: "subtotal" },
        { concepto: "Gastos", valor: -summary.gastos, tipo: "resta" },
        { concepto: "Pérdida por mermas", valor: -summary.perdidaMermas, tipo: "resta" },
        { concepto: "Ganancia neta", valor: summary.gananciaNeta, tipo: "total" },
        { concepto: "Compras (inversión en inventario)", valor: summary.compras, tipo: "info" },
        { concepto: "Flujo de caja", valor: summary.flujoCaja, tipo: "info" },
      ]
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="size-4 text-primary" />
          Resumen financiero
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Une ventas, gastos, compras y mermas del período. Las compras se muestran como
          inversión (no restan de la ganancia neta para no duplicar el costo de venta).
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
          canExport={Boolean(data)}
          isFetching={isFetching}
          footer={footer}
        />

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <SummaryCard label="Ventas" value={fmtMoney(summary.ventas)} />
            <SummaryCard label="Ganancia bruta" value={fmtMoney(summary.gananciaBruta)} />
            <SummaryCard label="Gastos" value={fmtMoney(summary.gastos)} />
            <SummaryCard label="Mermas" value={fmtMoney(summary.perdidaMermas)} />
            <SummaryCard label="Compras" value={fmtMoney(summary.compras)} />
            <SummaryCard label="Ganancia neta" value={fmtMoney(summary.gananciaNeta)} highlight />
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : summary ? (
          <>
            <EstadoResultados lineas={lineas} />
            <div className="hidden md:block">
              <ResumenTable dto={data!} />
            </div>
            <div className="md:hidden">
              <ResumenMobileList dto={data!} />
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

function EstadoResultados({ lineas }: { lineas: LineaConcepto[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-muted-foreground">Estado de resultados</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Concepto</TableHead>
            <TableHead className="w-32 text-right">Monto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lineas.map((linea) => (
            <TableRow
              key={linea.concepto}
              className={
                linea.tipo === "total"
                  ? "border-t-2 border-primary/40 bg-muted/50 font-semibold"
                  : undefined
              }
            >
              <TableCell>
                <span
                  className={
                    linea.tipo === "total"
                      ? "font-semibold"
                      : linea.tipo === "subtotal"
                        ? "line-clamp-1 font-medium"
                        : "line-clamp-1"
                  }
                >
                  {linea.concepto}
                </span>
              </TableCell>
              <TableCell
                className={
                  linea.tipo === "total"
                    ? "text-right font-bold text-primary"
                    : "text-right font-medium"
                }
              >
                {fmtSigned(linea.valor)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function ResumenTable({ dto }: { dto: ResumenReportDto }) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(dto.days, PAGE_SIZE)

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-muted-foreground">Serie por día</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Fecha</TableHead>
            <TableHead className="text-right">Ventas</TableHead>
            <TableHead className="text-right">Gan. bruta</TableHead>
            <TableHead className="text-right">Gastos</TableHead>
            <TableHead className="text-right">Mermas</TableHead>
            <TableHead className="text-right">Compras</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.fecha}>
              <TableCell className="text-muted-foreground">{fmtDate(row.fecha)}</TableCell>
              <TableCell className="text-right">{fmtMoney(row.ventas)}</TableCell>
              <TableCell className="text-right font-medium">{fmtMoney(row.gananciaBruta)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{fmtMoney(row.gastos)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{fmtMoney(row.mermas)}</TableCell>
              <TableCell className="text-right text-muted-foreground">{fmtMoney(row.compras)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DataTablePagination page={page} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}

function ResumenMobileList({ dto }: { dto: ResumenReportDto }) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(dto.days, MOBILE_PAGE_SIZE)

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-muted-foreground">Serie por día</h3>
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.fecha} className="list-none">
            <Card className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{fmtDate(row.fecha)}</span>
                <span className="shrink-0 text-sm font-semibold text-primary">
                  {fmtMoney(row.gananciaBruta)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span>
                  <span className="block font-medium text-foreground">{fmtMoney(row.ventas)}</span>
                  Ventas
                </span>
                <span>
                  <span className="block font-medium text-foreground">{fmtMoney(row.gastos)}</span>
                  Gastos
                </span>
                <span>
                  <span className="block font-medium text-foreground">{fmtMoney(row.compras)}</span>
                  Compras
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

function fmtSigned(value: number): string {
  if (value < 0) return `- ${fmtMoney(-value)}`
  return fmtMoney(value)
}

async function exportResumen(dto: ResumenReportDto): Promise<void> {
  await exportRowsToExcel({
    sheetName: "Resumen financiero",
    filename: `resumen-financiero-${rangeName(dto.from, dto.to)}.xlsx`,
    columns: [
      { header: "Fecha", key: "fecha", width: 14 },
      { header: "Ventas", key: "ventas", width: 14, numFmt: MONEY },
      { header: "Costo", key: "costo", width: 14, numFmt: MONEY },
      { header: "Ganancia bruta", key: "gananciaBruta", width: 15, numFmt: MONEY },
      { header: "Gastos", key: "gastos", width: 14, numFmt: MONEY },
      { header: "Mermas", key: "mermas", width: 14, numFmt: MONEY },
      { header: "Compras", key: "compras", width: 14, numFmt: MONEY },
    ],
    rows: dto.days,
    totalRow: {
      fecha: "TOTAL",
      ventas: dto.summary.ventas,
      costo: dto.summary.costo,
      gananciaBruta: dto.summary.gananciaBruta,
      gastos: dto.summary.gastos,
      mermas: dto.summary.perdidaMermas,
      compras: dto.summary.compras,
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