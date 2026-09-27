import type { ReactNode } from "react"
import {
  BoxesIcon,
  CircleDollarSignIcon,
  Clock3Icon,
  HandCoinsIcon,
  PackageSearchIcon,
  PackageXIcon,
  PieChartIcon,
  ReceiptIcon,
  ShoppingCartIcon,
  TrendingDownIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react"

import { CarteraReport } from "@/features/reports/components/cartera-report"
import { ClientsReport } from "@/features/reports/components/clients-report"
import { ComprasReport } from "@/features/reports/components/compras-report"
import { GastosReport } from "@/features/reports/components/gastos-report"
import { HoursReport } from "@/features/reports/components/hours-report"
import { MermasReport } from "@/features/reports/components/mermas-report"
import { PerdidasReport } from "@/features/reports/components/perdidas-report"
import { ProductsReport } from "@/features/reports/components/products-report"
import { ProfitReport } from "@/features/reports/components/profit-report"
import { ResumenReport } from "@/features/reports/components/resumen-report"
import { StockReport } from "@/features/reports/components/stock-report"

export interface ReportDef {
  id: string
  label: string
  description: string
  icon: LucideIcon
  component: () => ReactNode
}

export const REPORTS: ReportDef[] = [
  {
    id: "profit",
    label: "Ganancias por día",
    description:
      "Por cada producto de los pedidos aprobados, compara precio de compra vs. precio de venta. Ganancia por línea = (venta − compra) × cantidad.",
    icon: CircleDollarSignIcon,
    component: ProfitReport,
  },
  {
    id: "products",
    label: "Ventas por producto",
    description: "Unidades, ingresos, costo y ganancia de cada producto en pedidos aprobados.",
    icon: PackageSearchIcon,
    component: ProductsReport,
  },
  {
    id: "clients",
    label: "Pedidos por cliente",
    description: "Cuánto compra cada cliente: pedidos, unidades, ingresos y ganancia.",
    icon: UsersRoundIcon,
    component: ClientsReport,
  },
  {
    id: "cartera",
    label: "Cartera por período",
    description:
      "Cuotas de pago que caen en el rango: cuánto se debe cobrar, cuánto se ha cobrado y saldos.",
    icon: HandCoinsIcon,
    component: CarteraReport,
  },
  {
    id: "hours",
    label: "Horario de compras",
    description: "A qué horas del día se concentran las ventas.",
    icon: Clock3Icon,
    component: HoursReport,
  },
  {
    id: "gastos",
    label: "Gastos",
    description: "Todos los gastos de operación registrados en el período, con su monto.",
    icon: ReceiptIcon,
    component: GastosReport,
  },
  {
    id: "compras",
    label: "Compras",
    description: "Compras a proveedores en el período, con su monto y proveedor.",
    icon: ShoppingCartIcon,
    component: ComprasReport,
  },
  {
    id: "mermas",
    label: "Mermas",
    description: "Bajas de stock del período: unidades, costo y valor a precio de venta.",
    icon: PackageXIcon,
    component: MermasReport,
  },
  {
    id: "stock",
    label: "Inventario actual",
    description:
      "Existencias de cada producto con su valor a costo y a precio de venta, más avisos de agotados y stock bajo.",
    icon: BoxesIcon,
    component: StockReport,
  },
  {
    id: "perdidas",
    label: "Pérdidas",
    description:
      "Pérdida económica por mermas, línea por producto: costo real y valor de venta perdido.",
    icon: TrendingDownIcon,
    component: PerdidasReport,
  },
  {
    id: "resumen",
    label: "Resumen financiero",
    description:
      "Une ventas, gastos, compras y mermas del período. Las compras se muestran como inversión (no restan de la ganancia neta para no duplicar el costo de venta).",
    icon: PieChartIcon,
    component: ResumenReport,
  },
]

export function getReportDefinition(reportId: string): ReportDef | undefined {
  return REPORTS.find((report) => report.id === reportId)
}