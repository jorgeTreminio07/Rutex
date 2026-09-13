"use client"

import { HandCoinsIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ReportToolbar } from "@/features/reports/components/report-toolbar"
import { SummaryCard } from "@/features/reports/components/summary-card"
import { useCarteraReport } from "@/features/reports/hooks/use-reports"
import { useReportDateRange } from "@/features/reports/lib/date-range"
import { exportRowsToExcel } from "@/features/reports/lib/excel"
import { fmtDate, fmtMoney, rangeName } from "@/features/reports/lib/format"
import type { CarteraReportDto, CuotaEstado } from "@/types/interfaces/report.interface"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { usePaged } from "@/lib/use-paged"

const MONEY = "#,##0.00"
const PAGE_SIZE = 10

function estadoVariant(estado: CuotaEstado): "default" | "secondary" | "destructive" | "outline" {
  if (estado === "Pagado") return "default"
  if (estado === "Vencido") return "destructive"
  return "secondary"
}

export function CarteraReport() {
  const { from, to, setFrom, setTo, today, monthStart, applyPreset } = useReportDateRange()
  const { data, isLoading, isFetching } = useCarteraReport(from, to)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!data || data.rows.length === 0) return
    setIsExporting(true)
    try {
      await exportCarteraReport(data)
      toast.success("Archivo Excel descargado")
    } catch {
      toast.error("No se pudo generar el archivo Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const summary = data?.summary
  const footer = data ? `${data.rows.length} cuota(s) · pendiente ${fmtMoney(data.summary.pendiente)}` : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandCoinsIcon className="size-4 text-primary" />
          Cartera por período
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Cuotas de pago que caen en el rango: cuánto se debe cobrar, cuánto se ha cobrado y saldos.
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
            <SummaryCard label="Cuotas" value={String(summary.cuotas)} />
            <SummaryCard label="A cobrar" value={fmtMoney(summary.monto)} />
            <SummaryCard label="Cobrado" value={fmtMoney(summary.cobrado)} />
            <SummaryCard label="Pendiente" value={fmtMoney(summary.pendiente)} highlight />
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
              <CarteraTable dto={data} />
            </div>
            <div className="md:hidden">
              <CarteraMobileList dto={data} />
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No hay cuotas por cobrar en el rango seleccionado.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CarteraTable({ dto }: { dto: CarteraReportDto }) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(dto.rows, PAGE_SIZE)
  const s = dto.summary
  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-36">Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="w-20 text-right">Cuota</TableHead>
            <TableHead className="w-32">Fecha</TableHead>
            <TableHead className="w-28 text-right">Monto</TableHead>
            <TableHead className="w-28 text-right">Abonado</TableHead>
            <TableHead className="w-24">Estado</TableHead>
            <TableHead className="w-28 text-right">Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.orderNumber}-${row.cuota}`}>
              <TableCell className="font-medium">{row.orderNumber ?? "—"}</TableCell>
              <TableCell>
                <span className="line-clamp-1">{row.cliente}</span>
              </TableCell>
              <TableCell className="text-right">
                {row.cuota}/{row.cuotas}
              </TableCell>
              <TableCell className="text-muted-foreground">{fmtDate(row.fechaAbonar)}</TableCell>
              <TableCell className="text-right">{fmtMoney(row.monto)}</TableCell>
              <TableCell className="text-right">{fmtMoney(row.abonado)}</TableCell>
              <TableCell>
                <Badge variant={estadoVariant(row.estado)}>{row.estado}</Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">{fmtMoney(row.saldo)}</TableCell>
            </TableRow>
          ))}
          <TableRow className="border-t-2 border-primary/30 bg-muted/50 font-semibold">
            <TableCell colSpan={5}>TOTAL</TableCell>
            <TableCell className="text-right">{fmtMoney(s.cobrado)}</TableCell>
            <TableCell />
            <TableCell className="text-right text-primary">{fmtMoney(s.pendiente)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <DataTablePagination page={page} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
    </div>
  )
}

function CarteraMobileList({ dto }: { dto: CarteraReportDto }) {
  const { rows, page, totalItems, pageSize, setPage } = usePaged(dto.rows, PAGE_SIZE)
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={`${row.orderNumber}-${row.cuota}`} className="list-none">
            <Card className="flex flex-col gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.cliente}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.orderNumber ?? "—"} · cuota {row.cuota}/{row.cuotas}
                  </p>
                </div>
                <Badge variant={estadoVariant(row.estado)}>{row.estado}</Badge>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{fmtDate(row.fechaAbonar)}</span>
                <span>
                  Monto <span className="font-medium text-foreground">{fmtMoney(row.monto)}</span>
                </span>
                <span className={cn("font-semibold", row.saldo > 0 ? "text-destructive" : "text-primary")}>
                  Saldo {fmtMoney(row.saldo)}
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

async function exportCarteraReport(dto: CarteraReportDto): Promise<void> {
  await exportRowsToExcel({
    sheetName: "Cartera",
    filename: `cartera-por-periodo-${rangeName(dto.from, dto.to)}.xlsx`,
    columns: [
      { header: "Pedido", key: "orderNumber", width: 16 },
      { header: "Cliente", key: "cliente", width: 30 },
      { header: "Cuota", key: "cuota", width: 10, numFmt: "0" },
      { header: "De", key: "cuotas", width: 6, numFmt: "0" },
      { header: "Fecha", key: "fechaAbonar", width: 14 },
      { header: "Monto", key: "monto", width: 12, numFmt: MONEY },
      { header: "Abonado", key: "abonado", width: 12, numFmt: MONEY },
      { header: "Estado", key: "estado", width: 12 },
      { header: "Saldo", key: "saldo", width: 12, numFmt: MONEY },
    ],
    rows: dto.rows,
    totalRow: {
      orderNumber: "TOTAL",
      monto: dto.summary.monto,
      abonado: dto.summary.cobrado,
      saldo: dto.summary.pendiente,
    },
    totalLabel: "TOTAL",
  })
}