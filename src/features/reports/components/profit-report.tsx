"use client"

import { useState } from "react"
import { FileSpreadsheetIcon, Loader2Icon, TrendingUpIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfitMobileList } from "@/features/reports/components/profit-mobile-list"
import { ProfitTable } from "@/features/reports/components/profit-table"
import { useProfitReport } from "@/features/reports/hooks/use-profit-report"
import { exportProfitToExcel } from "@/features/reports/lib/excel"
import { cn } from "@/lib/utils"

function nicaTodayStr(): string {
  return new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`
}

function fmtMoney(value: number): string {
  return `C$ ${value.toFixed(2)}`
}

export function ProfitReport() {
  const [from, setFrom] = useState<string>(() => nicaTodayStr())
  const [to, setTo] = useState<string>(() => nicaTodayStr())
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading, isFetching } = useProfitReport(from, to)

  const applyPreset = (nextFrom: string, nextTo: string) => {
    setFrom(nextFrom)
    setTo(nextTo)
  }

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

  const today = nicaTodayStr()
  const monthStart = `${today.slice(0, 7)}-01`

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUpIcon className="size-4 text-primary" />
              Ganancias por día
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Pedidos aprobados: por cada producto, compara precio de compra vs. precio de
              venta. Ganancia por línea = (venta − compra) × cantidad.
            </p>
          </div>
          <Button onClick={handleExport} disabled={isExporting || isLoading || (data?.rows.length ?? 0) === 0}>
            {isExporting ? <Loader2Icon className="animate-spin" /> : <FileSpreadsheetIcon />}
            {isExporting ? "Generando…" : "Exportar Excel"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <DatePicker value={from} onChange={setFrom} placeholder="Desde" className="w-40" />
            <DatePicker value={to} onChange={setTo} placeholder="Hasta" className="w-40" />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => applyPreset(today, today)}
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => applyPreset(addDays(today, -6), today)}
            >
              7 días
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => applyPreset(monthStart, today)}
            >
              Este mes
            </Button>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {isFetching && <Loader2Icon className="size-3.5 animate-spin" />}
            <span>
              {data ? `${data.rows.length} línea(s) · ${data.summary.pedidos} pedido(s)` : "Cargando…"}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : data ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard label="Pedidos" value={String(data.summary.pedidos)} />
            <SummaryCard label="Ventas" value={fmtMoney(data.summary.ventas)} />
            <SummaryCard label="Costo" value={fmtMoney(data.summary.costo)} />
            <SummaryCard
              label="Ganancia"
              value={fmtMoney(data.summary.ganancia)}
              highlight
            />
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

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border p-4",
        highlight ? "border-primary/40 bg-primary/10" : "bg-muted/40",
      )}
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn("text-xl font-bold tracking-tight", highlight && "text-primary")}>
        {value}
      </span>
    </div>
  )
}