"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { REPORTS } from "@/features/reports/lib/report-registry"

export function ReportsView() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Elige un reporte para ver su análisis detallado.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {REPORTS.map((report) => {
          const Icon = report.icon
          return (
            <Card key={report.id} className="flex flex-col gap-3 p-4">
              <div className="flex flex-1 items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold leading-tight">{report.label}</h2>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {report.description}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href={`/reportes/${report.id}`} />}
                className="w-full sm:w-auto sm:self-end"
              >
                Ver reporte
              </Button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}