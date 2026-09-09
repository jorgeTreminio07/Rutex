"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  advanceDeliveryStatusRequest,
  getDeliveriesRequest,
} from "@/features/deliveries/api/deliveries.api"
import { getApiErrorMessage } from "@/lib/api-client"

export const deliveriesKeys = {
  all: ["deliveries"] as const,
}

export function useDeliveries() {
  return useQuery({
    queryKey: deliveriesKeys.all,
    queryFn: getDeliveriesRequest,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  })
}

export function useAdvanceDeliveryStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, statusId }: { id: string; statusId: number }) =>
      advanceDeliveryStatusRequest(id, statusId),
    onSuccess: () => {
      toast.success("Estado de entrega actualizado")
      queryClient.invalidateQueries({ queryKey: deliveriesKeys.all })
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "No se pudo actualizar el estado de la entrega")),
  })
}