"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createSupplierRequest,
  deleteSupplierRequest,
  getSuppliersRequest,
  updateSupplierRequest,
  type CreateSupplierPayload,
  type UpdateSupplierPayload,
} from "@/features/suppliers/api/suppliers.api"
import { getApiErrorMessage } from "@/lib/api-client"
import { LIST_REFRESH_MS } from "@/lib/query-params"

export const suppliersKeys = {
  all: ["suppliers"] as const,
}

export function useSuppliers() {
  return useQuery({
    queryKey: suppliersKeys.all,
    queryFn: getSuppliersRequest,
    refetchInterval: LIST_REFRESH_MS,
  })
}

export function useCreateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSupplierPayload) => createSupplierRequest(payload),
    onSuccess: () => {
      toast.success("Proveedor creado correctamente")
      queryClient.invalidateQueries({ queryKey: suppliersKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear el proveedor")),
  })
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSupplierPayload }) =>
      updateSupplierRequest(id, payload),
    onSuccess: () => {
      toast.success("Proveedor actualizado correctamente")
      queryClient.invalidateQueries({ queryKey: suppliersKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el proveedor")),
  })
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSupplierRequest(id),
    onSuccess: () => {
      toast.success("Proveedor eliminado correctamente")
      queryClient.invalidateQueries({ queryKey: suppliersKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el proveedor")),
  })
}