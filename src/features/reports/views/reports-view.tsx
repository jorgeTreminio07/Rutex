"use client"

import { CircleDollarSignIcon, Clock3Icon, HandCoinsIcon, PackageSearchIcon, UsersRoundIcon } from "lucide-react"

import { ProfitReport } from "@/features/reports/components/profit-report"
import { cn } from "@/lib/utils"

const REPORTS = [
  {
    id: "profit",
    label: "Ganancias por día",
    icon: CircleDollarSignIcon,
    available: true,
  },
  { id: "ventas-produto", label: "Ventas por producto", icon: PackageSearchIcon, available: false },
  { id: "clientes", label: "Pedidos por cliente", icon: UsersRoundIcon, available: false },
  { id: "cartera", label: "Cartera por período", icon: HandCoinsIcon, available: false },
  { id: "horario", label: "Horario de compras", icon: Clock3Icon, available: false },
] as const

export function ReportsView() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Análisis de ventas, ganancias y operación de la tienda.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {REPORTS.map((report) => {
          const Icon = report.icon
          return (
            <button
              key={report.id}
              type="button"
              disabled={!report.available}
              aria-current={report.available ? "true" : undefined}
              className={cn(
                "flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                report.available
                  ? "border-primary bg-primary text-primary-foreground"
                  : "cursor-not-allowed border-border text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
              {report.label}
              {!report.available && (
                <span className="text-[10px] opacity-70">· pronto</span>
              )}
            </button>
          )
        })}
      </div>

      <ProfitReport />
    </div>
  )
}