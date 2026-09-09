export interface ClientDto {
  id: string
  fullName: string
  phone: string
  cedula: string | null
  address: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  statusId: number
  createdAt: string
  updatedAt: string | null
}

export interface CreateClientPayload {
  fullName: string
  phone: string
  cedula?: string | null
  address?: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
}

export type UpdateClientPayload = Partial<CreateClientPayload>