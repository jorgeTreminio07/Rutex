"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createInventoryRequest,
  getInventoriesRequest,
  updateInventoryRequest,
  type CreateInventoryPayload,
  type UpdateInventoryPayload,
} from "@/features/inventories/api/inventories.api"
import { productsKeys } from "@/features/products/hooks/use-products"
import { getApiErrorMessage } from "@/lib/api-client"

export const inventoriesKeys = {
  all: ["inventories"] as const,
}

export function useInventories() {
  return useQuery({
    queryKey: inventoriesKeys.all,
    queryFn: getInventoriesRequest,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  })
}

export function useCreateInventory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInventoryPayload) => createInventoryRequest(payload),
    onSuccess: () => {
      toast.success("Inventario guardado correctamente")
      queryClient.invalidateQueries({ queryKey: inventoriesKeys.all })
      queryClient.invalidateQueries({ queryKey: productsKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear el inventario")),
  })
}

export function useUpdateInventory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateInventoryPayload }) =>
      updateInventoryRequest(id, payload),
    onSuccess: () => {
      toast.success("Inventario actualizado correctamente")
      queryClient.invalidateQueries({ queryKey: inventoriesKeys.all })
      queryClient.invalidateQueries({ queryKey: productsKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el inventario")),
  })
}