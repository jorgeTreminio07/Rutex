"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createUserRequest,
  deleteUserRequest,
  getUsersRequest,
  updateUserRequest,
  type CreateUserPayload,
  type UpdateUserPayload,
} from "@/features/users/api/users.api"
import { getApiErrorMessage } from "@/lib/api-client"
import { LIST_REFRESH_MS } from "@/lib/query-params"

export const usersKeys = {
  all: ["users"] as const,
}

export function useUsers() {
  return useQuery({
    queryKey: usersKeys.all,
    queryFn: getUsersRequest,
    refetchInterval: LIST_REFRESH_MS,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUserRequest(payload),
    onSuccess: () => {
      toast.success("Usuario creado correctamente")
      queryClient.invalidateQueries({ queryKey: usersKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear el usuario")),
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUserRequest(id, payload),
    onSuccess: () => {
      toast.success("Usuario actualizado correctamente")
      queryClient.invalidateQueries({ queryKey: usersKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el usuario")),
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUserRequest(id),
    onSuccess: () => {
      toast.success("Usuario eliminado correctamente")
      queryClient.invalidateQueries({ queryKey: usersKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el usuario")),
  })
}