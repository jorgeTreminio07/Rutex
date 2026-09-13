"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createCompraRequest,
  deleteCompraRequest,
  getComprasRequest,
  updateCompraRequest,
  type CreateCompraPayload,
  type GetComprasParams,
  type UpdateCompraPayload,
} from "@/features/compras/api/compras.api"
import { getApiErrorMessage } from "@/lib/api-client"
import { LIST_REFRESH_MS } from "@/lib/query-params"

export const comprasKeys = {
  all: ["compras"] as const,
  filtered: (params: GetComprasParams) => ["compras", "list", params] as const,
}

export function useCompras(params: GetComprasParams) {
  return useQuery({
    queryKey: comprasKeys.filtered(params),
    queryFn: () => getComprasRequest(params),
    placeholderData: keepPreviousData,
    refetchInterval: LIST_REFRESH_MS,
  })
}

export function useCreateCompra() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCompraPayload) => createCompraRequest(payload),
    onSuccess: () => {
      toast.success("Compra registrada correctamente")
      queryClient.invalidateQueries({ queryKey: comprasKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo registrar la compra")),
  })
}

export function useUpdateCompra() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCompraPayload }) =>
      updateCompraRequest(id, payload),
    onSuccess: () => {
      toast.success("Compra actualizada correctamente")
      queryClient.invalidateQueries({ queryKey: comprasKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar la compra")),
  })
}

export function useDeleteCompra() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCompraRequest(id),
    onSuccess: () => {
      toast.success("Compra eliminada correctamente")
      queryClient.invalidateQueries({ queryKey: comprasKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar la compra")),
  })
}