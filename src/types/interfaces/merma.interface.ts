export interface MermaItemDto {
  productId: string
  productName: string
  quantity: number
  purchasePrice: number
  sellPrice: number
}

export interface MermaMotivoDto {
  id: number
  name: string
}

export interface MermaDto {
  id: string
  mermaNumber: string
  motivoId: number
  motivoName: string
  items: MermaItemDto[]
  totalUnits: number
  totalValue: number
  observation: string | null
  createdAt: string
  updatedAt: string | null
}

export interface CreateMermaPayload {
  motivoId: number
  items: MermaItemDto[]
  observation?: string | null
}

export interface UpdateMermaPayload {
  motivoId: number
  items: MermaItemDto[]
  observation?: string | null
}