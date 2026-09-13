"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  advanceDeliveryStatusRequest,
  getDeliveriesRequest,
  type GetDeliveriesParams,
} from "@/features/deliveries/api/deliveries.api"
import { getApiErrorMessage } from "@/lib/api-client"
import { LIST_REFRESH_MS } from "@/lib/query-params"

export const deliveriesKeys = {
  all: ["deliveries"] as const,
  filtered: (params: GetDeliveriesParams) => ["deliveries", params] as const,
}

export function useDeliveries(params: GetDeliveriesParams) {
  return useQuery({
    queryKey: deliveriesKeys.filtered(params),
    queryFn: () => getDeliveriesRequest(params),
    placeholderData: keepPreviousData,
    refetchInterval: LIST_REFRESH_MS,
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