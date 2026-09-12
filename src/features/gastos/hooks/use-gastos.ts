"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createGastoRequest,
  deleteGastoRequest,
  getGastosRequest,
  updateGastoRequest,
  type CreateGastoPayload,
  type UpdateGastoPayload,
} from "@/features/gastos/api/gastos.api"
import { getApiErrorMessage } from "@/lib/api-client"

export const gastosKeys = {
  all: ["gastos"] as const,
}

export function useGastos() {
  return useQuery({
    queryKey: gastosKeys.all,
    queryFn: getGastosRequest,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  })
}

export function useCreateGasto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateGastoPayload) => createGastoRequest(payload),
    onSuccess: () => {
      toast.success("Gasto registrado correctamente")
      queryClient.invalidateQueries({ queryKey: gastosKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo registrar el gasto")),
  })
}

export function useUpdateGasto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGastoPayload }) =>
      updateGastoRequest(id, payload),
    onSuccess: () => {
      toast.success("Gasto actualizado correctamente")
      queryClient.invalidateQueries({ queryKey: gastosKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el gasto")),
  })
}

export function useDeleteGasto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteGastoRequest(id),
    onSuccess: () => {
      toast.success("Gasto eliminado correctamente")
      queryClient.invalidateQueries({ queryKey: gastosKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el gasto")),
  })
}