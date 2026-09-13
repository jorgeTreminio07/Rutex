"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { AXIS_TICK, CHART_COLORS, compactNumber } from "@/features/home/components/chart-theme"
import { fmtMoney } from "@/features/reports/lib/format"
import type { DashboardCashflowRow } from "@/types/interfaces/report.interface"

interface Props {
  data: DashboardCashflowRow[]
}

const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export function CashflowChart({ data }: Props) {
  const rows = data.map((row) => ({
    ...row,
    label: MONTH_LABELS[Number(row.mes.slice(5, 7)) - 1] ?? row.mes,
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={46}
          tickFormatter={compactNumber}
        />
        <Tooltip
          formatter={(value, name) => [fmtMoney(Number(value ?? 0)), String(name)]}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            fontSize: 13,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
        <Bar dataKey="ventas" name="Ventas" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
        <Bar dataKey="compras" name="Compras" fill={CHART_COLORS.quinary} radius={[4, 4, 0, 0]} />
        <Bar dataKey="gastos" name="Gastos" fill={CHART_COLORS.destructive} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}