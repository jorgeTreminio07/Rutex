"use client"

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { toast } from "sonner"

import {
  createProductRequest,
  deleteProductRequest,
  getProductCategoriesRequest,
  getProductsListRequest,
  getProductsRequest,
  updateProductRequest,
  type CreateProductPayload,
  type GetProductsParams,
  type UpdateProductPayload,
} from "@/features/products/api/products.api"
import { getApiErrorMessage } from "@/lib/api-client"
import { LIST_REFRESH_MS } from "@/lib/query-params"

export const productsKeys = {
  all: ["products"] as const,
  filtered: (params: GetProductsParams) => ["products", "list", params] as const,
  categories: ["products", "categories"] as const,
}

export function useProducts() {
  return useQuery({
    queryKey: productsKeys.all,
    queryFn: getProductsRequest,
    refetchInterval: LIST_REFRESH_MS,
  })
}

export function useProductsList(params: GetProductsParams) {
  return useQuery({
    queryKey: productsKeys.filtered(params),
    queryFn: () => getProductsListRequest(params),
    placeholderData: keepPreviousData,
    refetchInterval: LIST_REFRESH_MS,
  })
}

export function useProductCategories() {
  return useQuery({
    queryKey: productsKeys.categories,
    queryFn: getProductCategoriesRequest,
    staleTime: 60_000,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => createProductRequest(payload),
    onSuccess: () => {
      toast.success("Producto creado correctamente")
      queryClient.invalidateQueries({ queryKey: productsKeys.all })
      queryClient.invalidateQueries({ queryKey: productsKeys.categories })
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
      queryClient.invalidateQueries({ queryKey: productsKeys.categories })
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
      queryClient.invalidateQueries({ queryKey: productsKeys.categories })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "No se pudo eliminar el producto")),
  })
}
