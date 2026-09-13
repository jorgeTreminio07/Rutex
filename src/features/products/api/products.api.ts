import { apiClient } from "@/lib/api-client"
import { appendListParams, type ListQueryParams } from "@/lib/query-params"
import type { ProductDto, CreateProductPayload, UpdateProductPayload } from "@/types/interfaces/product.interface"
import type { PaginatedResult } from "@/types/interfaces/pagination.interface"

export type { CreateProductPayload, UpdateProductPayload }

export type GetProductsParams = ListQueryParams & { category?: string }

function buildQueryString(params: GetProductsParams): string {
  const url = new URL("/api/products", window.location.origin)
  appendListParams(url, params)
  if (params.category && params.category !== "todas") {
    url.searchParams.set("category", params.category)
  }
  return url.pathname + url.search
}

export async function getProductsRequest(): Promise<ProductDto[]> {
  return apiClient.get<ProductDto[]>("/api/products")
}

export async function getProductsListRequest(
  params: GetProductsParams,
): Promise<PaginatedResult<ProductDto>> {
  return apiClient.get<PaginatedResult<ProductDto>>(buildQueryString(params))
}

export async function getProductCategoriesRequest(): Promise<string[]> {
  return apiClient.get<string[]>("/api/products/categories")
}

export async function getProductRequest(id: string): Promise<ProductDto> {
  return apiClient.get<ProductDto>(`/api/products/${id}`)
}

export async function createProductRequest(payload: CreateProductPayload): Promise<ProductDto> {
  return apiClient.post<ProductDto>("/api/products", payload)
}

export async function updateProductRequest(id: string, payload: UpdateProductPayload): Promise<ProductDto> {
  return apiClient.put<ProductDto>(`/api/products/${id}`, payload)
}

export async function deleteProductRequest(id: string): Promise<void> {
  return apiClient.delete(`/api/products/${id}`)
}

export async function uploadProductImageRequest(file: File, name: string): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("name", name)
  return apiClient.post<{ url: string }>("/api/uploads", formData)
}
