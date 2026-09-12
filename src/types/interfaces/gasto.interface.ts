export interface GastoDto {
  id: string
  title: string
  observation: string | null
  amount: number
  receiptPath: string | null
  receiptUrl: string | null
  createdAt: string
  updatedAt: string | null
}

export interface CreateGastoPayload {
  title: string
  observation?: string | null
  amount: number
  receiptPath?: string | null
}

export interface UpdateGastoPayload {
  title?: string
  observation?: string | null
  amount?: number
  receiptPath?: string | null
}