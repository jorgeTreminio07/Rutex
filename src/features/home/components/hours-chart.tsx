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

import { AXIS_TICK, CHART_COLORS } from "@/features/home/components/chart-theme"
import type { DashboardHorarioRow } from "@/types/interfaces/report.interface"

interface Props {
  data: DashboardHorarioRow[]
}

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`
}

export function HoursChart({ data }: Props) {
  const rows = data.map((row) => ({ ...row, label: hourLabel(row.hora) }))
  const activeHours = rows.filter((row) => row.pedidos > 0)
  const shown = activeHours.length > 1 ? activeHours : rows

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={shown} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.muted} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} minTickGap={12} />
        <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          formatter={(value, name) => [Number(value ?? 0), String(name)]}
          labelFormatter={(label) => String(label)}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            fontSize: 13,
          }}
        />
        <Bar dataKey="pedidos" name="Pedidos" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}