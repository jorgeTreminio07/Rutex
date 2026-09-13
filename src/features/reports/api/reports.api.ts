import { apiClient } from "@/lib/api-client"
import type {
  CarteraReportDto,
  ClientSalesReportDto,
  HourSalesReportDto,
  ProductSalesReportDto,
  ProfitReportDto,
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