import { apiClient } from "@/lib/api-client"
import { appendListParams, type ListQueryParams } from "@/lib/query-params"
import type {
  AbonoDto,
  CarteraPagoDto,
  CarteraStatusFilter,
} from "@/types/interfaces/cartera.interface"
import type { PaginatedResult } from "@/types/interfaces/pagination.interface"

export type GetCarteraParams = ListQueryParams & { status?: CarteraStatusFilter }

function buildQueryString(params: GetCarteraParams): string {
  const url = new URL("/api/cartera", window.location.origin)
  appendListParams(url, params)
  if (params.status && params.status !== "todos") {
    url.searchParams.set("status", params.status)
  }
  return url.pathname + url.search
}

export async function getCarteraRequest(
  params: GetCarteraParams,
): Promise<PaginatedResult<CarteraPagoDto>> {
  return apiClient.get<PaginatedResult<CarteraPagoDto>>(buildQueryString(params))
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

export type { AbonoDto }