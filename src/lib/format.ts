// Muestra una cantidad (entera o fraccionaria, máx 3 decimales) sin ceros de
// relleno: 3 → "3", 1.5 → "1.5", 0.25 → "0.25".
export function formatQty(value: number | string | null | undefined): string {
  const num = typeof value === "number" ? value : Number(value) || 0
  if (Number.isInteger(num)) return String(Math.round(num))
  return String(Math.round(num * 1000) / 1000)
}

// Redondea una cantidad a un máximo de 3 decimales (0.5, 1.25…).
export function roundQty(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

// Valida que una cantidad sea mayor a 0, finita y con a lo sumo 3 decimales.
export function isValidQty(value: number): boolean {
  if (!Number.isFinite(value) || value <= 0) return false
  return Math.abs(value - roundQty(value)) < 1e-9
}

// Redondea a 2 decimales (dinero).
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

// Formatea un monto de dinero con separador de miles: 1234.5 → "C$ 1,234.50".
export function fmtMoney(value: number): string {
  const sign = value < 0 ? "-" : ""
  const abs = round2(Math.abs(value))
  const [int, dec] = abs.toFixed(2).split(".")
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  return `C$ ${sign}${grouped}.${dec}`
}