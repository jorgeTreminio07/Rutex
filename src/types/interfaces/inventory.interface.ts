export interface InventoryItemDto {
  productId: string
  productName: string
  quantity: number
}

export interface InventoryDto {
  id: string
  inventoryNumber: string
  items: InventoryItemDto[]
  totalUnits: number
  totalValue: number
  createdAt: string
  updatedAt: string | null
}

export interface CreateInventoryPayload {
  items: InventoryItemDto[]
}

export interface UpdateInventoryPayload {
  items: InventoryItemDto[]
}