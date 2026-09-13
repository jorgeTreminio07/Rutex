import { apiClient } from "@/lib/api-client"
import type { ProfitReportDto } from "@/types/interfaces/report.interface"

export async function getProfitReportRequest(from: string, to: string): Promise<ProfitReportDto> {
  const params = new URLSearchParams({ from, to })
  return apiClient.get<ProfitReportDto>(`/api/reports/profit?${params.toString()}`)
}