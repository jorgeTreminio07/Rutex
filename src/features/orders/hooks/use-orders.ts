"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createOrderRequest,
  deleteOrderRequest,
  getOrdersRequest,
  saveOrderProformaRequest,
  updateOrderStatusRequest,
  type GetOrdersParams,
} from "@/features/orders/api/orders.api"
import { getApiErrorMessage } from "@/lib/api-client"
import { LIST_REFRESH_MS } from "@/lib/query-params"

export const ordersKeys = {
  all: ["orders"] as const,
  filtered: (params: GetOrdersParams) => ["orders", params] as const,
}

export function useOrders(params: GetOrdersParams = {}) {
  return useQuery({
    queryKey: ordersKeys.filtered(params),
    queryFn: () => getOrdersRequest(params),
    placeholderData: keepPreviousData,
    refetchInterval: LIST_REFRESH_MS,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createOrderRequest,
    onSuccess: () => {
      toast.success("Pedido creado correctamente")
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear el pedido")),
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, statusId }: { id: string; statusId: number }) =>
      updateOrderStatusRequest(id, statusId),
    onSuccess: () => {
      toast.success("Pedido actualizado correctamente")
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el pedido")),
  })
}

export function useDeleteOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteOrderRequest(id),
    onSuccess: () => {
      toast.success("Pedido eliminado correctamente")
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el pedido")),
  })
}

export function useSaveOrderProforma() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) => saveOrderProformaRequest(id, url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKeys.all })
    },
  })
}
