"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createRoleRequest,
  deleteRoleRequest,
  getRolesRequest,
  updateRoleRequest,
  type CreateRolePayload,
  type UpdateRolePayload,
} from "@/features/roles/api/roles.api"
import { getApiErrorMessage } from "@/lib/api-client"

export const rolesKeys = {
  all: ["roles"] as const,
}

export function useRoles() {
  return useQuery({
    queryKey: rolesKeys.all,
    queryFn: getRolesRequest,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => createRoleRequest(payload),
    onSuccess: () => {
      toast.success("Rol creado correctamente")
      queryClient.invalidateQueries({ queryKey: rolesKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear el rol")),
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      updateRoleRequest(id, payload),
    onSuccess: () => {
      toast.success("Rol actualizado correctamente")
      queryClient.invalidateQueries({ queryKey: rolesKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el rol")),
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRoleRequest(id),
    onSuccess: () => {
      toast.success("Rol eliminado correctamente")
      queryClient.invalidateQueries({ queryKey: rolesKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el rol")),
  })
}