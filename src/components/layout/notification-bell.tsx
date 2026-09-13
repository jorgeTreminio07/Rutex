"use client"

import {
  BellIcon,
  CalendarClockIcon,
  ClipboardListIcon,
  InboxIcon,
  PackageXIcon,
  ShieldAlertIcon,
  TruckIcon,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDashboard } from "@/features/home/hooks/use-dashboard"

interface AlertItem {
  key: string
  label: string
  count: number
  href: string
  icon: typeof BellIcon
}

export function NotificationBell() {
  const router = useRouter()
  const { data, isLoading, isError } = useDashboard()

  const entregasPendientes =
    data?.entregas
      .filter((e) => e.statusId === 1 || e.statusId === 2)
      .reduce((sum, e) => sum + e.count, 0) ?? 0

  const alerts: AlertItem[] = data
    ? [
        {
          key: "pedidos",
          label: "Pedidos por revisar",
          count: data.kpis.pedidosEnProceso,
          href: "/pedidos",
          icon: ClipboardListIcon,
        },
        {
          key: "cuotas",
          label: "Cuotas vencidas",
          count: data.kpis.cuotasVencidas,
          href: "/cartera",
          icon: CalendarClockIcon,
        },
        {
          key: "stock",
          label: "Productos con stock bajo",
          count: data.kpis.stockBajos,
          href: "/productos",
          icon: PackageXIcon,
        },
        {
          key: "entregas",
          label: "Entregas pendientes",
          count: entregasPendientes,
          href: "/almacen",
          icon: TruckIcon,
        },
      ]
    : []

  const activeAlerts = alerts.filter((a) => a.count > 0)
  const totalCount = activeAlerts.reduce((sum, a) => sum + a.count, 0)

  const goTo = (href: string) => router.push(href)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative size-9 rounded-full md:size-12"
            aria-label="Notificaciones"
          />
        }
      >
        <BellIcon className="size-5" />
        {totalCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground md:top-1.5 md:right-1.5">
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 py-2 text-sm font-bold text-foreground">
            Alertas
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {isError ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center text-sm text-muted-foreground">
            <ShieldAlertIcon className="size-5" />
            Solo los administradores pueden ver las alertas de la tienda.
          </div>
        ) : isLoading || !data ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Cargando alertas…
          </div>
        ) : activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center text-sm text-muted-foreground">
            <InboxIcon className="size-5" />
            Todo al día, sin alertas por el momento.
          </div>
        ) : (
          <div className="flex max-h-80 flex-col overflow-y-auto">
            {activeAlerts.map((alert) => {
              const Icon = alert.icon
              return (
                <DropdownMenuItem
                  key={alert.key}
                  onClick={() => goTo(alert.href)}
                  className="gap-3 px-3 py-2.5"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {alert.label}
                  </span>
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-bold text-primary">
                    {alert.count}
                  </span>
                </DropdownMenuItem>
              )
            })}
          </div>
        )}

        {data && <DropdownMenuSeparator />}
        {data && (
          <DropdownMenuItem
            onClick={() => goTo("/")}
            className="cursor-pointer justify-center text-xs text-muted-foreground"
          >
            Ver el panel de la tienda
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}