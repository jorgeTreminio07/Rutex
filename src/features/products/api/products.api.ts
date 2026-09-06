import { apiClient } from "@/lib/api-client"
import type { ProductDto, CreateProductPayload, UpdateProductPayload } from "@/types/interfaces/product.interface"

export type { CreateProductPayload, UpdateProductPayload }

export async function getProductsRequest(): Promise<ProductDto[]> {
  return apiClient.get<ProductDto[]>("/api/products")
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
