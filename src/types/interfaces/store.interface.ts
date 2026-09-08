export interface BankAccountDto {
  id: string
  bankName: string
  currency: string
  accountHolder: string
  accountNumber: string
  lastFourDigits: string
  qrUrl: string | null
}

export interface CityDto {
  id: number
  name: string
  createdAt: string
}

export interface StoreProfileDto {
  id: string
  name: string | null
  ownerName: string | null
  logoUrl: string | null
  stampUrl: string | null
  signatureUrl: string | null
  ruc: string | null
  email: string | null
  address: string | null
  phone: string | null
  workingHours: string | null
  bankAccounts: BankAccountDto[]
}
