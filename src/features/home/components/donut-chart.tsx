"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { useIsTouchDevice } from "@/features/home/hooks/use-is-touch-device"
import type { ReactNode } from "react"

export interface DonutSlice {
  name: string
  value: number
  color: string
}

interface Props {
  data: DonutSlice[]
  center: ReactNode
}

export function DonutChart({ data, center }: Props) {
  const isTouch = useIsTouchDevice()

  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="88%"
            paddingAngle={2}
            strokeWidth={0}
            isAnimationActive={false}
          >
            {data.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            trigger={isTouch ? "click" : "hover"}
            formatter={(value, name) => [Number(value ?? 0), String(name)]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--popover)",
              fontSize: 13,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {center}
      </div>
    </div>
  )
}