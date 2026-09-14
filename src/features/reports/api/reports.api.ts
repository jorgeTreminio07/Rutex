import { apiClient } from "@/lib/api-client"
import type {
  CarteraReportDto,
  ClientSalesReportDto,
  CompraReportDto,
  GastoReportDto,
  HourSalesReportDto,
  MermaReportDto,
  PerdidaReportDto,
  ProductSalesReportDto,
  ProfitReportDto,
  ResumenReportDto,
} from "@/types/interfaces/report.interface"

const rangeParams = (from: string, to: string) =>
  new URLSearchParams({ from, to }).toString()

export async function getProfitReportRequest(from: string, to: string): Promise<ProfitReportDto> {
  return apiClient.get<ProfitReportDto>(`/api/reports/profit?${rangeParams(from, to)}`)
}

export async function getProductSalesReportRequest(
  from: string,
  to: string,
): Promise<ProductSalesReportDto> {
  return apiClient.get<ProductSalesReportDto>(`/api/reports/products?${rangeParams(from, to)}`)
}

export async function getClientSalesReportRequest(
  from: string,
  to: string,
): Promise<ClientSalesReportDto> {
  return apiClient.get<ClientSalesReportDto>(`/api/reports/clients?${rangeParams(from, to)}`)
}

export async function getCarteraReportRequest(from: string, to: string): Promise<CarteraReportDto> {
  return apiClient.get<CarteraReportDto>(`/api/reports/cartera?${rangeParams(from, to)}`)
}

export async function getHourSalesReportRequest(
  from: string,
  to: string,
): Promise<HourSalesReportDto> {
  return apiClient.get<HourSalesReportDto>(`/api/reports/hours?${rangeParams(from, to)}`)
}

export async function getGastoReportRequest(from: string, to: string): Promise<GastoReportDto> {
  return apiClient.get<GastoReportDto>(`/api/reports/gastos?${rangeParams(from, to)}`)
}

export async function getCompraReportRequest(from: string, to: string): Promise<CompraReportDto> {
  return apiClient.get<CompraReportDto>(`/api/reports/compras?${rangeParams(from, to)}`)
}

export async function getMermaReportRequest(from: string, to: string): Promise<MermaReportDto> {
  return apiClient.get<MermaReportDto>(`/api/reports/mermas?${rangeParams(from, to)}`)
}

export async function getPerdidaReportRequest(from: string, to: string): Promise<PerdidaReportDto> {
  return apiClient.get<PerdidaReportDto>(`/api/reports/perdidas?${rangeParams(from, to)}`)
}

export async function getResumenReportRequest(
  from: string,
  to: string,
): Promise<ResumenReportDto> {
  return apiClient.get<ResumenReportDto>(`/api/reports/resumen?${rangeParams(from, to)}`)
}