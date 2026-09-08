"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  getCarteraRequest,
  registrarAbonoRequest,
} from "@/features/cartera/api/cartera.api"
import { ordersKeys } from "@/features/orders/hooks/use-orders"
import { getApiErrorMessage } from "@/lib/api-client"

export const carteraKeys = {
  all: ["cartera"] as const,
}

export function useCartera() {
  return useQuery({
    queryKey: carteraKeys.all,
    queryFn: getCarteraRequest,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
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