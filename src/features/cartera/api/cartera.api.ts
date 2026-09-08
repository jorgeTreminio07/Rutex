import { apiClient } from "@/lib/api-client"
import type {
  AbonoDto,
  CarteraPagoDto,
  CarteraStatusFilter,
} from "@/types/interfaces/cartera.interface"

export async function getCarteraRequest(): Promise<CarteraPagoDto[]> {
  return apiClient.get<CarteraPagoDto[]>("/api/cartera")
}

export async function registrarAbonoRequest(
  orderId: string,
  monto: number,
): Promise<{ monto: number; saldoAnterior: number; saldoNuevo: number }> {
  return apiClient.post<{ monto: number; saldoAnterior: number; saldoNuevo: number }>(
    `/api/cartera/${orderId}/abonos`,
    { monto },
  )
}

export function matchesCarteraStatus(
  estadoPagoId: number,
  filter: CarteraStatusFilter,
): boolean {
  if (filter === "todos") return true
  if (filter === "pagado") return estadoPagoId === 2
  if (filter === "en_mora") return estadoPagoId === 3
  return estadoPagoId !== 2 && estadoPagoId !== 3
}

export type { AbonoDto }