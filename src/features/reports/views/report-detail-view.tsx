"use client"

import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { getReportDefinition } from "@/features/reports/lib/report-registry"

interface ReportDetailViewProps {
  reportId: string
}

export function ReportDetailView({ reportId }: ReportDetailViewProps) {
  const definition = getReportDefinition(reportId)

  if (!definition) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Button variant="ghost" nativeButton={false} render={<Link href="/reportes" />}>
          <ArrowLeftIcon /> Volver a reportes
        </Button>
        <p className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">
          No se encontró el reporte &quot;{reportId}&quot;.
        </p>
      </div>
    )
  }

  const ReportComponent = definition.component

  return (
    <div className="flex flex-col gap-5">
      <Button
        variant="ghost"
        nativeButton={false}
        render={<Link href="/reportes" />}
        className="w-fit -m-2"
      >
        <ArrowLeftIcon /> Reportes
      </Button>

      <ReportComponent />
    </div>
  )
}