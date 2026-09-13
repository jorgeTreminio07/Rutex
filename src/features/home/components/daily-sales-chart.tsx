"use client"

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { AXIS_TICK, CHART_COLORS, compactNumber } from "@/features/home/components/chart-theme"
import { useIsTouchDevice } from "@/features/home/hooks/use-is-touch-device"
import { fmtMoney } from "@/features/reports/lib/format"
import type { DashboardVentasDiaRow } from "@/types/interfaces/report.interface"

interface Props {
  data: DashboardVentasDiaRow[]
}

export function DailySalesChart({ data }: Props) {
  const isTouch = useIsTouchDevice()
  const rows = data.map((row) => ({
    ...row,
    label: `${row.fecha.slice(8)}/${row.fecha.slice(5, 7)}`,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          interval={Math.max(0, Math.round(rows.length / 12) - 1)}
          minTickGap={24}
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={46}
          tickFormatter={compactNumber}
        />
        <Tooltip
          trigger={isTouch ? "click" : "hover"}
          formatter={(value) => fmtMoney(Number(value ?? 0))}
          labelFormatter={(label) => `Día ${String(label)}`}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            fontSize: 13,
          }}
        />
        <Bar
          dataKey="ventas"
          name="Ventas"
          fill={CHART_COLORS.primary}
          radius={[4, 4, 0, 0]}
        />
        <Line
          type="monotone"
          dataKey="ganancia"
          name="Ganancia"
          stroke={CHART_COLORS.tertiary}
          strokeWidth={2.5}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}