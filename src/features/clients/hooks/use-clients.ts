"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createClientRequest,
  deleteClientRequest,
  getClientsListRequest,
  getClientsRequest,
  updateClientRequest,
  type CreateClientPayload,
  type GetClientsParams,
  type UpdateClientPayload,
} from "@/features/clients/api/clients.api"
import { getApiErrorMessage } from "@/lib/api-client"
import { LIST_REFRESH_MS } from "@/lib/query-params"

export const clientsKeys = {
  all: ["clients"] as const,
  filtered: (params: GetClientsParams) => ["clients", "list", params] as const,
}

export function useClients() {
  return useQuery({
    queryKey: clientsKeys.all,
    queryFn: getClientsRequest,
    refetchInterval: LIST_REFRESH_MS,
  })
}

export function useClientsList(params: GetClientsParams) {
  return useQuery({
    queryKey: clientsKeys.filtered(params),
    queryFn: () => getClientsListRequest(params),
    placeholderData: keepPreviousData,
    refetchInterval: LIST_REFRESH_MS,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateClientPayload) => createClientRequest(payload),
    onSuccess: () => {
      toast.success("Cliente creado correctamente")
      queryClient.invalidateQueries({ queryKey: clientsKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear el cliente")),
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClientPayload }) =>
      updateClientRequest(id, payload),
    onSuccess: () => {
      toast.success("Cliente actualizado correctamente")
      queryClient.invalidateQueries({ queryKey: clientsKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el cliente")),
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteClientRequest(id),
    onSuccess: () => {
      toast.success("Cliente eliminado correctamente")
      queryClient.invalidateQueries({ queryKey: clientsKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el cliente")),
  })
}