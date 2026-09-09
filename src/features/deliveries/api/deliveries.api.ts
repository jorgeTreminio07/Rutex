import { apiClient } from "@/lib/api-client"
import type { DeliveryDto } from "@/types/interfaces/delivery.interface"

export async function getDeliveriesRequest(): Promise<DeliveryDto[]> {
  return apiClient.get<DeliveryDto[]>("/api/deliveries")
}

export async function advanceDeliveryStatusRequest(id: string, statusId: number): Promise<DeliveryDto> {
  return apiClient.put<DeliveryDto>(`/api/deliveries/${id}`, { statusId })
}