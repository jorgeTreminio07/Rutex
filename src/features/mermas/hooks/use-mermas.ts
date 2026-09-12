"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createMermaRequest,
  deleteMermaRequest,
  getMermaMotivosRequest,
  getMermasRequest,
  updateMermaRequest,
  type CreateMermaPayload,
  type UpdateMermaPayload,
} from "@/features/mermas/api/mermas.api"
import { productsKeys } from "@/features/products/hooks/use-products"
import { getApiErrorMessage } from "@/lib/api-client"

export const mermasKeys = {
  all: ["mermas"] as const,
  motivos: ["mermas", "motivos"] as const,
}

export function useMermas() {
  return useQuery({
    queryKey: mermasKeys.all,
    queryFn: getMermasRequest,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  })
}

export function useMermaMotivos() {
  return useQuery({
    queryKey: mermasKeys.motivos,
    queryFn: getMermaMotivosRequest,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateMerma() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMermaPayload) => createMermaRequest(payload),
    onSuccess: () => {
      toast.success("Merma guardada correctamente")
      queryClient.invalidateQueries({ queryKey: mermasKeys.all })
      queryClient.invalidateQueries({ queryKey: productsKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear la merma")),
  })
}

export function useUpdateMerma() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMermaPayload }) =>
      updateMermaRequest(id, payload),
    onSuccess: () => {
      toast.success("Merma actualizada correctamente")
      queryClient.invalidateQueries({ queryKey: mermasKeys.all })
      queryClient.invalidateQueries({ queryKey: productsKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar la merma")),
  })
}

export function useDeleteMerma() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteMermaRequest(id),
    onSuccess: () => {
      toast.success("Merma eliminada y stock restaurado")
      queryClient.invalidateQueries({ queryKey: mermasKeys.all })
      queryClient.invalidateQueries({ queryKey: productsKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar la merma")),
  })
}