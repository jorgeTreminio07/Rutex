"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createCompraRequest,
  deleteCompraRequest,
  getComprasRequest,
  updateCompraRequest,
  type CreateCompraPayload,
  type UpdateCompraPayload,
} from "@/features/compras/api/compras.api"
import { getApiErrorMessage } from "@/lib/api-client"

export const comprasKeys = {
  all: ["compras"] as const,
}

export function useCompras() {
  return useQuery({
    queryKey: comprasKeys.all,
    queryFn: getComprasRequest,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
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