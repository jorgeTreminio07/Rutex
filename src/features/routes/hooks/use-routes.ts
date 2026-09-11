"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  cancelRouteRequest,
  createRouteRequest,
  deleteRouteRequest,
  getRouteByCodeRequest,
  getRoutesRequest,
  updateRouteClientRequest,
} from "@/features/routes/api/routes.api"
import { getApiErrorMessage } from "@/lib/api-client"
import type {
  CreateRoutePayload,
  RouteDto,
  UpdateRouteClientPayload,
} from "@/types/interfaces/route.interface"

export const routesKeys = {
  all: ["routes"] as const,
}

export function routeByCodeKey(code: string) {
  return ["routes", "detail", code] as const
}

export function useRoutes() {
  return useQuery({
    queryKey: routesKeys.all,
    queryFn: getRoutesRequest,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  })
}

export function useCreateRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRoutePayload) => createRouteRequest(payload),
    onSuccess: () => {
      toast.success("Ruta creada correctamente")
      queryClient.invalidateQueries({ queryKey: routesKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear la ruta")),
  })
}

export function useRouteByCode(code: string) {
  return useQuery({
    queryKey: routeByCodeKey(code),
    queryFn: () => getRouteByCodeRequest(code),
    enabled: Boolean(code),
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  })
}

export function useUpdateRouteClient(code: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      clientId,
      payload,
    }: {
      clientId: string
      payload: UpdateRouteClientPayload
    }) => updateRouteClientRequest(code, clientId, payload),
    onSuccess: (result) => {
      toast.success("Visita actualizada correctamente")
      queryClient.setQueryData<RouteDto>(routeByCodeKey(code), (old) => {
        if (!old) return old
        return {
          ...old,
          status: result.routeStatus,
          clients: old.clients.map((c) => (c.id === result.client.id ? result.client : c)),
        }
      })
      queryClient.invalidateQueries({ queryKey: routesKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar la visita")),
  })
}

export function useCancelRoute(code: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => cancelRouteRequest(code),
    onSuccess: () => {
      toast.success("Ruta cancelada")
      queryClient.setQueryData<RouteDto>(routeByCodeKey(code), (old) =>
        old ? { ...old, status: "cancelada" } : old,
      )
      queryClient.invalidateQueries({ queryKey: routesKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo cancelar la ruta")),
  })
}

export function useDeleteRoute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => deleteRouteRequest(code),
    onSuccess: () => {
      toast.success("Ruta eliminada correctamente")
      queryClient.invalidateQueries({ queryKey: routesKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar la ruta")),
  })
}