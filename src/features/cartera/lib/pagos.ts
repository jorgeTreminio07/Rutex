// La tienda opera en Nicaragua (UTC-6, sin horario de verano).
// El "hoy" local se computa restando 6 horas a la hora actual.
export function nicaraguaToday(): string {
  const shifted = new Date(Date.now() - 6 * 60 * 60 * 1000)
  return shifted.toISOString().slice(0, 10)
}

export function addDaysToDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

// Reparte un total en N partes iguales (la última absorbe el residuo)
// para que la suma de todas sea exactamente el total.
export function splitAmount(total: number, parts: number): number[] {
  const base = round2(total / parts)
  const values = Array.from({ length: parts }, () => base)
  const diff = round2(total - base * parts)
  if (diff !== 0) values[parts - 1] = round2(values[parts - 1] + diff)
  return values
}

export interface AbonoPlan {
  fecha: string
  monto: number
}

// Plan de abonos al aprobar un pedido según su modalidad de pago:
// - contado  => un solo abono (monto total) con fecha de hoy
// - cuotas_2 => 2 abonos quincenales (cada 15 días)
// - cuotas_4 => 4 abonos semanales (cada 7 días)
export function buildAbonoPlan(
  paymentType: string,
  total: number,
  fromDate = nicaraguaToday(),
): AbonoPlan[] {
  if (paymentType === "cuotas_2") {
    return splitAmount(total, 2).map((monto, i) => ({
      fecha: addDaysToDate(fromDate, (i + 1) * 15),
      monto,
    }))
  }
  if (paymentType === "cuotas_4") {
    return splitAmount(total, 4).map((monto, i) => ({
      fecha: addDaysToDate(fromDate, (i + 1) * 7),
      monto,
    }))
  }
  return [{ fecha: fromDate, monto: round2(total) }]
}

// Estado de pago derivado de los abonos de un pedido:
// - sin abonos            => 1 (Pendiente)
// - todos pagados         => 2 (Pagado)
// - alguno vencido sin pagar => 3 (En mora)
// - en otro caso          => 1 (Pendiente)
export function computePagoEstadoId(
  abonos: Array<{ pagado: boolean; fecha_a_abonar: string }>,
  today = nicaraguaToday(),
): number {
  if (abonos.length === 0) return 1
  if (abonos.every((a) => a.pagado)) return 2
  if (abonos.some((a) => !a.pagado && (a.fecha_a_abonar ?? "") < today)) return 3
  return 1
}