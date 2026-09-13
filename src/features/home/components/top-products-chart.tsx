"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { AXIS_TICK, CHART_COLORS, compactNumber } from "@/features/home/components/chart-theme"
import { fmtMoney } from "@/features/reports/lib/format"
import type { DashboardTopProductoRow } from "@/types/interfaces/report.interface"

interface Props {
  data: DashboardTopProductoRow[]
}

export function TopProductsChart({ data }: Props) {
  const rows = data.map((row) => ({ ...row, name: row.producto }))
  const height = Math.max(180, rows.length * 34 + 40)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }} barCategoryGap={6}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} horizontal={false} />
        <XAxis
          type="number"
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          tickFormatter={compactNumber}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fontSize: 12, fill: "currentColor", opacity: 0.75 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value, name) =>
            String(name) === "ventas" ? fmtMoney(Number(value ?? 0)) : Number(value ?? 0)
          }
          cursor={{ fill: CHART_COLORS.muted, opacity: 0.4 }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            fontSize: 13,
          }}
        />
        <Bar dataKey="ventas" name="Ventas" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}