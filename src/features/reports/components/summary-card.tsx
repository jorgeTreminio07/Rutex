"use client"

import { cn } from "@/lib/utils"

export function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl border p-4",
        highlight ? "border-primary/40 bg-primary/10" : "bg-muted/40",
      )}
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn("text-xl font-bold tracking-tight", highlight && "text-primary")}>
        {value}
      </span>
    </div>
  )
}