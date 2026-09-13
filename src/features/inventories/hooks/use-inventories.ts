"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createInventoryRequest,
  getInventoriesRequest,
  updateInventoryRequest,
  type CreateInventoryPayload,
  type GetInventoriesParams,
  type UpdateInventoryPayload,
} from "@/features/inventories/api/inventories.api"
import { productsKeys } from "@/features/products/hooks/use-products"
import { getApiErrorMessage } from "@/lib/api-client"
import { LIST_PAGE_SIZE, LIST_REFRESH_MS } from "@/lib/query-params"

export const inventoriesKeys = {
  all: ["inventories"] as const,
  filtered: (filters: GetInventoriesParams) => ["inventories", filters] as const,
}

export function useInventories(filters: GetInventoriesParams) {
  return useQuery({
    queryKey: inventoriesKeys.filtered(filters),
    queryFn: () => getInventoriesRequest(filters),
    placeholderData: keepPreviousData,
    refetchInterval: LIST_REFRESH_MS,
  })
}

export { LIST_PAGE_SIZE }

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