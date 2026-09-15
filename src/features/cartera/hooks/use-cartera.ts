"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  editarAbonoRequest,
  eliminarAbonoRequest,
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
    onSuccess: () => {
      toast.success("Abono registrado correctamente")
      queryClient.invalidateQueries({ queryKey: carteraKeys.all })
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo registrar el abono")),
  })
}

export function useEditarAbono() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      orderId,
      registroId,
      monto,
    }: {
      orderId: string
      registroId: string
      monto: number
    }) => editarAbonoRequest(orderId, registroId, monto),
    onSuccess: () => {
      toast.success("Abono actualizado correctamente")
      queryClient.invalidateQueries({ queryKey: carteraKeys.all })
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el abono")),
  })
}

export function useEliminarAbono() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      orderId,
      registroId,
    }: {
      orderId: string
      registroId: string
    }) => eliminarAbonoRequest(orderId, registroId),
    onSuccess: () => {
      toast.success("Abono eliminado correctamente")
      queryClient.invalidateQueries({ queryKey: carteraKeys.all })
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el abono")),
  })
}