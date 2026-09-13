"use client"

import { TrendingUpIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfitMobileList } from "@/features/reports/components/profit-mobile-list"
import { ProfitTable } from "@/features/reports/components/profit-table"
import { ReportToolbar } from "@/features/reports/components/report-toolbar"
import { SummaryCard } from "@/features/reports/components/summary-card"
import { useProfitReport } from "@/features/reports/hooks/use-reports"
import { useReportDateRange } from "@/features/reports/lib/date-range"
import { exportProfitToExcel } from "@/features/reports/lib/excel"
import { fmtMoney } from "@/features/reports/lib/format"

export function ProfitReport() {
  const { from, to, setFrom, setTo, today, monthStart, applyPreset } = useReportDateRange()
  const { data, isLoading, isFetching } = useProfitReport(from, to)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (!data || data.rows.length === 0) {
      toast.info("No hay datos para exportar en el rango seleccionado")
      return
    }
    setIsExporting(true)
    try {
      await exportProfitToExcel(data)
      toast.success("Archivo Excel descargado")
    } catch {
      toast.error("No se pudo generar el archivo Excel")
    } finally {
      setIsExporting(false)
    }
  }

  const summary = data?.summary
  const footer = data ? `${data.rows.length} línea(s) · ${data.summary.pedidos} pedido(s)` : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUpIcon className="size-4 text-primary" />
          Ganancias por día
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pedidos aprobados: por cada producto, compara precio de compra vs. precio de venta.
          Ganancia por línea = (venta − compra) × cantidad.
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
            <SummaryCard label="Costo" value={fmtMoney(summary.costo)} />
            <SummaryCard label="Ganancia" value={fmtMoney(summary.ganancia)} highlight />
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data && data.rows.length > 0 ? (
          <>
            <div className="hidden md:block">
              <ProfitTable rows={data.rows} summary={data.summary} />
            </div>
            <div className="md:hidden">
              <ProfitMobileList rows={data.rows} summary={data.summary} />
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