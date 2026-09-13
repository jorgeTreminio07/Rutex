import { apiClient } from "@/lib/api-client"
import type { DashboardDto } from "@/types/interfaces/report.interface"

export async function getDashboardRequest(): Promise<DashboardDto> {
  return apiClient.get<DashboardDto>("/api/dashboard")
}