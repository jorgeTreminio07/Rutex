"use client"

import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import {
  AlertTriangleIcon,
  CircleDollarSignIcon,
  Clock3Icon,
  HandCoinsIcon,
  HourglassIcon,
  PackageSearchIcon,
  PackageXIcon,
  ReceiptTextIcon,
  TrendingUpIcon,
  WarehouseIcon,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CashflowChart } from "@/features/home/components/cashflow-chart"
import { CHART_COLORS } from "@/features/home/components/chart-theme"
import { DailySalesChart } from "@/features/home/components/daily-sales-chart"
import { DonutChart, type DonutSlice } from "@/features/home/components/donut-chart"
import { HoursChart } from "@/features/home/components/hours-chart"
import { MermasMotiveChart } from "@/features/home/components/mermas-motive-chart"
import { StockBajoList } from "@/features/home/components/stock-bajo-list"
import { TopProductsChart } from "@/features/home/components/top-products-chart"
import { useDashboard } from "@/features/home/hooks/use-dashboard"
import { useAuthStore } from "@/features/auth/store/use-auth-store"
import { fmtMoney } from "@/features/reports/lib/format"
import { cn } from "@/lib/utils"

function KpiCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string
  value: string
  icon: LucideIcon
  highlight?: boolean
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            highlight ? "bg-destructive/10 text-destructive" : "bg-primary/15 text-primary",
          )}
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("truncate text-lg font-bold", highlight && "text-destructive")}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ChartCard({
  title,
  description,
  icon: Icon,
  className,
  contentClassName,
  children,
}: {
  title: string
  description?: string
  icon: LucideIcon
  className?: string
  contentClassName?: string
  children: ReactNode
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className={cn("flex flex-col gap-3", contentClassName ?? "h-72")}>{children}</CardContent>
    </Card>
  )
}

function Legend({ items }: { items: { name: string; value: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-full" style={{ background: item.color }} />
          <span>{item.name}</span>
          <span className="font-semibold text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-40 items-center justify-center text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

export function HomeView() {
  const user = useAuthStore((s) => s.user)
  const { data, isLoading, isError } = useDashboard()

  if (isError) {
    return (
      <div className="flex flex-col gap-5">
        <Header user={user?.username ?? ""} />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No se pudo cargar el panel de la tienda. Verifica que tu usuario tenga permisos de administrador.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-5">
        <Header user={user?.username ?? ""} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className={cn("h-80 rounded-xl", i % 3 === 0 && i !== 4 && "lg:col-span-2")} />
          ))}
        </div>
      </div>
    )
  }

  const { kpis } = data

  const carteraTotal = data.cartera.cobrado + data.cartera.pendiente
  const carteraSlices: DonutSlice[] = [
    { name: "Cobrado", value: data.cartera.cobrado, color: CHART_COLORS.secondary },
    { name: "Pendiente", value: data.cartera.pendiente, color: CHART_COLORS.destructive },
  ]

  const entregasTotal = data.entregas.reduce((sum, row) => sum + row.count, 0)
  const entregasSlices: DonutSlice[] = data.entregas.map((row) => ({
    name: row.status,
    value: row.count,
    color:
      row.statusId === 1
        ? CHART_COLORS.primary
        : row.statusId === 2
          ? CHART_COLORS.quinary
          : CHART_COLORS.secondary,
  }))

  return (
    <div className="flex flex-col gap-5">
      <Header user={user?.username ?? ""} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Ventas hoy" value={fmtMoney(kpis.ventasHoy)} icon={CircleDollarSignIcon} />
        <KpiCard label="Ganancia hoy" value={fmtMoney(kpis.gananciaHoy)} icon={TrendingUpIcon} />
        <KpiCard label="Pedidos en proceso" value={String(kpis.pedidosEnProceso)} icon={HourglassIcon} />
        <KpiCard label="Cartera pendiente" value={fmtMoney(kpis.carteraPendiente)} icon={HandCoinsIcon} />
        <KpiCard
          label="Cuotas vencidas"
          value={String(kpis.cuotasVencidas)}
          icon={AlertTriangleIcon}
          highlight={kpis.cuotasVencidas > 0}
        />
        <KpiCard
          label="Productos con stock bajo"
          value={String(kpis.stockBajos)}
          icon={PackageXIcon}
          highlight={kpis.stockBajos > 0}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <ChartCard
          title="Ventas y ganancia por día"
          description="Últimos 30 días, pedidos aprobados. Barras = ventas, línea = ganancia."
          icon={CircleDollarSignIcon}
          className="lg:col-span-2"
        >
          <DailySalesChart data={data.ventasPorDia} />
        </ChartCard>

        <ChartCard title="Cartera" description="Dinero cobrado vs por cobrar de toda la cartera." icon={HandCoinsIcon}>
          {carteraTotal > 0 ? (
            <>
              <div className="h-52">
                <DonutChart
                  data={carteraSlices}
                  center={
                    <>
                      <span className="text-lg font-bold">{fmtMoney(data.cartera.pendiente)}</span>
                      <span className="text-xs text-muted-foreground">pendiente</span>
                    </>
                  }
                />
              </div>
              <Legend
                items={[
                  { name: "Cobrado", value: fmtMoney(data.cartera.cobrado), color: CHART_COLORS.secondary },
                  { name: "Pendiente", value: fmtMoney(data.cartera.pendiente), color: CHART_COLORS.destructive },
                ]}
              />
            </>
          ) : (
            <EmptyChart message="La cartera está al día." />
          )}
        </ChartCard>

        <ChartCard
          title="Flujo de caja"
          description="Ventas vs compras vs gastos de los últimos 6 meses."
          icon={ReceiptTextIcon}
          className="lg:col-span-2"
        >
          <CashflowChart data={data.cashflow} />
        </ChartCard>

        <ChartCard title="Entregas" description="Pedidos aprobados según estado del almacén." icon={WarehouseIcon}>
          {entregasTotal > 0 ? (
            <>
              <div className="h-52">
                <DonutChart
                  data={entregasSlices}
                  center={
                    <>
                      <span className="text-lg font-bold">{entregasTotal}</span>
                      <span className="text-xs text-muted-foreground">entregas</span>
                    </>
                  }
                />
              </div>
              <Legend
                items={data.entregas.map((row) => ({
                  name: row.status,
                  value: String(row.count),
                  color:
                    row.statusId === 1
                      ? CHART_COLORS.primary
                      : row.statusId === 2
                        ? CHART_COLORS.quinary
                        : CHART_COLORS.secondary,
                }))}
              />
            </>
          ) : (
            <EmptyChart message="Sin entregas registradas." />
          )}
        </ChartCard>

        <ChartCard
          title="Productos más vendidos"
          description="Top 10 por ventas en los últimos 30 días."
          icon={PackageSearchIcon}
          className="lg:col-span-2"
          contentClassName="h-auto"
        >
          {data.topProductos.length > 0 ? (
            <TopProductsChart data={data.topProductos} />
          ) : (
            <EmptyChart message="Sin ventas en el período." />
          )}
        </ChartCard>

        <ChartCard title="Horario de ventas" description="Pedidos aprobados por hora (hora de Nicaragua)." icon={Clock3Icon}>
          {data.horario.length > 0 ? (
            <HoursChart data={data.horario} />
          ) : (
            <EmptyChart message="Sin ventas en el período." />
          )}
        </ChartCard>

        <ChartCard
          title="Stock bajo"
          description="Productos con 5 unidades o menos (los 10 más críticos)."
          icon={PackageXIcon}
          className="lg:col-span-2"
          contentClassName="h-auto"
        >
          <StockBajoList data={data.stockBajo} />
        </ChartCard>

        <ChartCard
          title="Mermas por motivo"
          description="Pérdida de inventario según motivo."
          icon={AlertTriangleIcon}
          contentClassName="h-auto"
        >
          <MermasMotiveChart data={data.mermasPorMotivo} />
        </ChartCard>
      </div>
    </div>
  )
}

function Header({ user }: { user: string }) {
  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">Hola, {user}</h1>
      <p className="text-sm text-muted-foreground">Panel general de la tienda.</p>
    </div>
  )
}