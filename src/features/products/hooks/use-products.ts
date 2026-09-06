"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createProductRequest,
  deleteProductRequest,
  getProductsRequest,
  updateProductRequest,
  type CreateProductPayload,
  type UpdateProductPayload,
} from "@/features/products/api/products.api"
import { getApiErrorMessage } from "@/lib/api-client"

export const productsKeys = {
  all: ["products"] as const,
}

export function useProducts() {
  return useQuery({
    queryKey: productsKeys.all,
    queryFn: getProductsRequest,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProductRequest(payload),
    onSuccess: () => {
      toast.success("Producto creado correctamente")
      queryClient.invalidateQueries({ queryKey: productsKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo crear el producto")),
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProductPayload }) =>
      updateProductRequest(id, payload),
    onSuccess: () => {
      toast.success("Producto actualizado correctamente")
      queryClient.invalidateQueries({ queryKey: productsKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo actualizar el producto")),
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteProductRequest(id),
    onSuccess: () => {
      toast.success("Producto eliminado correctamente")
      queryClient.invalidateQueries({ queryKey: productsKeys.all })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el producto")),
  })
}
