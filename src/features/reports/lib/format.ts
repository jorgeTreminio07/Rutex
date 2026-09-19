import { fmtMoney } from "@/lib/format"

export { fmtMoney }

export function fmtDate(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function fmtShortDate(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("es-NI", {
    day: "2-digit",
    month: "short",
  })
}

export function fmtHora(hora: number): string {
  return `${String(hora).padStart(2, "0")}:00`
}

export function rangeName(from: string, to: string): string {
  return from === to ? from : `${from}-a-${to}`
}