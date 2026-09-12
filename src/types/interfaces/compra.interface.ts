export interface CompraDto {
  id: string
  title: string
  supplierId: string | null
  supplierName: string | null
  observation: string | null
  amount: number
  receiptPath: string | null
  receiptUrl: string | null
  createdAt: string
  updatedAt: string | null
}

export interface CreateCompraPayload {
  title: string
  supplierId: string
  observation?: string | null
  amount: number
  receiptPath?: string | null
}

export interface UpdateCompraPayload {
  title?: string
  supplierId?: string
  observation?: string | null
  amount?: number
  receiptPath?: string | null
}