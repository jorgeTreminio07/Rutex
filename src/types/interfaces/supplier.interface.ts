export interface SupplierDto {
  id: string
  name: string
  ruc: string
  phone: string
  address: string | null
  ownerName: string | null
  email: string | null
  statusId: number
  createdAt: string
  updatedAt: string | null
}

export interface CreateSupplierPayload {
  name: string
  ruc: string
  phone: string
  address?: string | null
  ownerName?: string | null
  email?: string | null
}

export type UpdateSupplierPayload = Partial<CreateSupplierPayload>