export interface AbonoDto {
  id: string
  orderId: string
  fechaAbonar: string
  montoAbonar: number
  abonado: number
  pagado: boolean
  fechaPago: string | null
}

export interface AbonoRegistroDto {
  id: string
  orderId: string
  monto: number
  fecha: string
}

export interface CarteraPagoDto {
  id: string
  orderNumber: string | null
  customerName: string
  customerPhone: string | null
  total: number
  paymentType: string
  createdAt: string
  estadoPagoId: number
  estadoPago: string
  abonado: number
  saldo: number
  abonos: AbonoDto[]
  registros: AbonoRegistroDto[]
}

export type CarteraStatusFilter = "todos" | "pendiente" | "pagado" | "en_mora"

export function pagoEstadoLabel(estadoPagoId: number): string {
  if (estadoPagoId === 2) return "Pagado"
  if (estadoPagoId === 3) return "En mora"
  return "Pendiente"
}

export function abonoEstadoLabel(abono: { pagado: boolean; fechaAbonar: string }): string {
  if (abono.pagado) return "Pagado"
  if (abono.fechaAbonar < new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString().slice(0, 10)) {
    return "Vencido"
  }
  return "Pendiente"
}