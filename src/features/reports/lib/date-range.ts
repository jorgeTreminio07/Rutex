"use client"

import { useState } from "react"

export function nicaTodayStr(): string {
  return new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`
}

/**
 * Estado de rango de fechas de un reporte: arranca en "Hoy" (Nicaragua)
 * y expone los accesos rápidos Hoy / 7 días / Este mes.
 */
export function useReportDateRange() {
  const today = nicaTodayStr()
  const monthStart = `${today.slice(0, 7)}-01`
  const [from, setFrom] = useState<string>(today)
  const [to, setTo] = useState<string>(today)

  const applyPreset = (nextFrom: string, nextTo: string) => {
    setFrom(nextFrom)
    setTo(nextTo)
  }

  return { from, to, setFrom, setTo, today, monthStart, applyPreset }
}