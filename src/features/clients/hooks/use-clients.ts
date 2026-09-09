"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createClientRequest,
  deleteClientRequest,
  getClientsRequest,
  updateClientRequest,
  type CreateClientPayload,
  type UpdateClientPayload,
} from "@/features/clients/api/clients.api"
import { getApiErrorMessage } from "@/lib/api-client"

export const clientsKeys = {
  all: ["clients"] as const,
}

export function useClients() {
  return useQuery({
    queryKey: clientsKeys.all,
    queryFn: getClientsRequest,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
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