"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getCarteraRequest,
  registrarAbonoRequest,
  type GetCarteraParams,
} from "@/features/cartera/api/cartera.api"
import { ordersKeys } from "@/features/orders/hooks/use-orders"
import { getApiErrorMessage } from "@/lib/api-client"
import { LIST_REFRESH_MS } from "@/lib/query-params"

export const carteraKeys = {
  all: ["cartera"] as const,
  filtered: (params: GetCarteraParams) => ["cartera", params] as const,
}

export function useCartera(params: GetCarteraParams) {
  return useQuery({
    queryKey: carteraKeys.filtered(params),
    queryFn: () => getCarteraRequest(params),
    placeholderData: keepPreviousData,
    refetchInterval: LIST_REFRESH_MS,
  })
}

export function useRegistrarAbono() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, monto }: { orderId: string; monto: number }) =>
      registrarAbonoRequest(orderId, monto),
    onSuccess: (_data, variables) => {
      toast.success("Abono registrado correctamente")
      queryClient.invalidateQueries({ queryKey: carteraKeys.all })
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
      void variables
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo registrar el abono")),
  })
}