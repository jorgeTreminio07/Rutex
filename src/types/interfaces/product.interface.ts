export interface ProductDto {
  id: string
  name: string
  description: string | null
  purchasePrice: number
  price: number
  discountPercent: number
  category: string
  stock: number
  images: string[]
  statusId: number
  createdAt: string
}

export interface CreateProductPayload {
  name: string
  description?: string
  purchasePrice?: number
  price: number
  discountPercent?: number
  category: string
  stock: number
  images?: string[]
}

export interface UpdateProductPayload {
  name?: string
  description?: string
  purchasePrice?: number
  price?: number
  discountPercent?: number
  category?: string
  stock?: number
  images?: string[]
}
