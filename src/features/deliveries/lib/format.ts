export const NICARAGUA_TIME_ZONE = "America/Managua"

// Día en Nicaragua (UTC-6) para filtrar: YYYY-MM-DD
export function nicaDate(dateStr: string): string {
  return new Date(new Date(dateStr).getTime() - 6 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

// Fecha y hora en hora de Nicaragua (ej. 08/09/2026, 10:35 a.m.)
export function nicaDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString("es-NI", {
    timeZone: NICARAGUA_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}