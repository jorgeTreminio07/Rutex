"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createMermaRequest,
  deleteMermaRequest,
  getMermaMotivosRequest,
  getMermasRequest,
  updateMermaRequest,
  type CreateMermaPayload,
  type GetMermasParams,
  type UpdateMermaPayload,
} from "@/features/mermas/api/mermas.api"
import { productsKeys } from "@/features/products/hooks/use-products"
import { getApiErrorMessage } from "@/lib/api-client"
import { LIST_REFRESH_MS } from "@/lib/query-params"

export const mermasKeys = {
  all: ["mermas"] as const,
  filtered: (params: GetMermasParams) => ["mermas", "list", params] as const,
  motivos: ["mermas", "motivos"] as const,
}

export function useMermas(params: GetMermasParams) {
  return useQuery({
    queryKey: mermasKeys.filtered(params),
    queryFn: () => getMermasRequest(params),
    placeholderData: keepPreviousData,
    refetchInterval: LIST_REFRESH_MS,
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