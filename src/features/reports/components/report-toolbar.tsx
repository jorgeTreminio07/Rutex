"use client"

import { FileSpreadsheetIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { addDays } from "@/features/reports/lib/date-range"

interface ReportToolbarProps {
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  onOpenChange?: (open: boolean) => void
  onPreset: (from: string, to: string) => void
  today: string
  monthStart: string
  onExport: () => void
  isExporting?: boolean
  canExport?: boolean
  isFetching?: boolean
  footer?: string
}

export function ReportToolbar({
  from,
  to,
  onFromChange,
  onToChange,
  onPreset,
  today,
  monthStart,
  onExport,
  isExporting = false,
  canExport = true,
  isFetching = false,
  footer,
}: ReportToolbarProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <DatePicker value={from} onChange={onFromChange} placeholder="Desde" className="w-40" />
        <DatePicker value={to} onChange={onToChange} placeholder="Hasta" className="w-40" />
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => onPreset(today, today)}
          >
            Hoy
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => onPreset(addDays(today, -6), today)}
          >
            7 días
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => onPreset(monthStart, today)}
          >
            Este mes
          </Button>
        </div>
        <Button onClick={onExport} disabled={isExporting || !canExport}>
          {isExporting ? <Loader2Icon className="animate-spin" /> : <FileSpreadsheetIcon />}
          {isExporting ? "Generando…" : "Exportar Excel"}
        </Button>
      </div>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        {isFetching && <Loader2Icon className="size-3.5 animate-spin" />}
        <span>{footer ?? "Cargando…"}</span>
      </div>
    </div>
  )
}