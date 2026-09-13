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
import { useIsTouchDevice } from "@/features/home/hooks/use-is-touch-device"
import { fmtMoney } from "@/features/reports/lib/format"
import type { DashboardMermaMotivoRow } from "@/types/interfaces/report.interface"

interface Props {
  data: DashboardMermaMotivoRow[]
}

export function MermasMotiveChart({ data }: Props) {
  const isTouch = useIsTouchDevice()
  if (data.length === 0) {
    return (
      <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        Sin mermas registradas.
      </div>
    )
  }

  const rows = data.map((row) => ({ ...row, name: row.motivo }))
  const height = Math.max(160, rows.length * 38 + 30)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }} barCategoryGap={7}>
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
          width={120}
          tick={{ fontSize: 12, fill: "currentColor", opacity: 0.75 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          trigger={isTouch ? "click" : "hover"}
          formatter={(value) => fmtMoney(Number(value ?? 0))}
          cursor={{ fill: CHART_COLORS.muted, opacity: 0.4 }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            fontSize: 13,
          }}
        />
        <Bar dataKey="total" name="Pérdida (C$)" fill={CHART_COLORS.destructive} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}