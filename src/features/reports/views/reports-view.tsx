"use client"

import { useState, type ReactNode } from "react"
import {
  CircleDollarSignIcon,
  Clock3Icon,
  HandCoinsIcon,
  PackageSearchIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react"

import { CarteraReport } from "@/features/reports/components/cartera-report"
import { ClientsReport } from "@/features/reports/components/clients-report"
import { HoursReport } from "@/features/reports/components/hours-report"
import { ProductsReport } from "@/features/reports/components/products-report"
import { ProfitReport } from "@/features/reports/components/profit-report"
import { cn } from "@/lib/utils"

interface ReportDef {
  id: string
  label: string
  icon: LucideIcon
  component: () => ReactNode
}

const REPORTS: ReportDef[] = [
  { id: "profit", label: "Ganancias por día", icon: CircleDollarSignIcon, component: ProfitReport },
  { id: "products", label: "Ventas por producto", icon: PackageSearchIcon, component: ProductsReport },
  { id: "clients", label: "Pedidos por cliente", icon: UsersRoundIcon, component: ClientsReport },
  { id: "cartera", label: "Cartera por período", icon: HandCoinsIcon, component: CarteraReport },
  { id: "hours", label: "Horario de compras", icon: Clock3Icon, component: HoursReport },
]

export function ReportsView() {
  const [activeId, setActiveId] = useState<string>("profit")
  const ActiveReport = REPORTS.find((r) => r.id === activeId)?.component ?? ProfitReport

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Análisis de ventas, ganancias, cartera y operación de la tienda.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {REPORTS.map((report) => {
          const Icon = report.icon
          const active = report.id === activeId
          return (
            <button
              key={report.id}
              type="button"
              onClick={() => setActiveId(report.id)}
              aria-pressed={active}
              className={cn(
                "flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {report.label}
            </button>
          )
        })}
      </div>

      <ActiveReport />
    </div>
  )
}