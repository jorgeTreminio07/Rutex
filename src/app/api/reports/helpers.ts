import { badRequest } from "@/lib/api-response"
import type { NextResponse } from "next/server"

// La tienda opera en Nicaragua (UTC-6, sin horario de verano):
// un día local va de las 06:00 UTC a las 06:00 UTC del día siguiente.
export function nicaraguaDayRange(dateStr: string): { start: string; end: string } {
  const [y, m, d] = dateStr.split("-").map(Number)
  const start = new Date(Date.UTC(y, m - 1, d, 6, 0, 0))
  const end = new Date(start.getTime() + 86_400_000)
  return { start: start.toISOString(), end: end.toISOString() }
}

export function nicaToday(): string {
  return new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export function nicaDate(dateStr: string): string {
  return new Date(new Date(dateStr).getTime() - 6 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
}

export function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value) || 0
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export function parseReportRange(
  url: URL,
): { ok: true; from: string; to: string } | { ok: false; response: NextResponse } {
  const defaultDate = nicaToday()
  let from = url.searchParams.get("from")?.trim() || defaultDate
  let to = url.searchParams.get("to")?.trim() || from

  if (!DATE_REGEX.test(from) || !DATE_REGEX.test(to)) {
    return { ok: false, response: badRequest("Fechas inválidas. Usa el formato YYYY-MM-DD") }
  }
  if (to < from) [from, to] = [to, from]

  return { ok: true, from, to }
}

export interface OrderItemSnapshot {
  productId?: string
  productName?: string
  quantity?: number
  price?: number
  purchasePrice?: number
}

export function parseOrderItems(items: unknown): OrderItemSnapshot[] {
  return Array.isArray(items) ? (items as OrderItemSnapshot[]) : []
}

export interface MermaItemSnapshot {
  productId?: string
  productName?: string
  quantity?: number
  purchasePrice?: number
  sellPrice?: number
}

export function parseMermaItems(items: unknown): MermaItemSnapshot[] {
  return Array.isArray(items) ? (items as MermaItemSnapshot[]) : []
}