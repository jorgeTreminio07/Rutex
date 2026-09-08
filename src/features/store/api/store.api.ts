import { apiClient } from "@/lib/api-client"
import type {
  BankAccountDto,
  CityDto,
  StoreProfileDto,
} from "@/types/interfaces/store.interface"

export interface UpdateStorePayload {
  name: string
  ownerName?: string
  ruc?: string
  email?: string
  address?: string
  phone?: string
  workingHours?: string
  logo?: File | null
  stamp?: File | null
  signature?: File | null
  removeLogo?: boolean
  removeStamp?: boolean
  removeSignature?: boolean
}

export interface BankAccountPayload {
  bankName: string
  currency: string
  accountNumber: string
  accountHolder: string
  qrCode?: File | null
  removeQr?: boolean
}

function buildStoreFormData(payload: UpdateStorePayload): FormData {
  const formData = new FormData()
  formData.append("name", payload.name ?? "")
  formData.append("ownerName", payload.ownerName ?? "")

  for (const key of ["ruc", "email", "address", "phone", "workingHours"] as const) {
    formData.append(key, payload[key] ?? "")
  }

  if (payload.logo) {
    formData.append("logo", payload.logo, payload.logo.name)
  }

  if (payload.stamp) {
    formData.append("stamp", payload.stamp, payload.stamp.name)
  }

  if (payload.signature) {
    formData.append("signature", payload.signature, payload.signature.name)
  }

  if (payload.removeLogo) formData.append("removeLogo", "true")
  if (payload.removeStamp) formData.append("removeStamp", "true")
  if (payload.removeSignature) formData.append("removeSignature", "true")

  return formData
}

function buildBankAccountFormData(payload: BankAccountPayload): FormData {
  const formData = new FormData()
  formData.append("bankName", payload.bankName)
  formData.append("currency", payload.currency)
  formData.append("accountNumber", payload.accountNumber)
  formData.append("accountHolder", payload.accountHolder)

  if (payload.qrCode) {
    formData.append("qrCode", payload.qrCode, payload.qrCode.name)
  }

  if (payload.removeQr) formData.append("removeQr", "true")

  return formData
}

export async function getStoreProfileRequest(): Promise<StoreProfileDto | null> {
  return apiClient.get<StoreProfileDto | null>("/api/store")
}

export async function updateStoreProfileRequest(
  payload: UpdateStorePayload,
): Promise<StoreProfileDto> {
  const formData = buildStoreFormData(payload)
  return apiClient.put<StoreProfileDto>("/api/store", formData)
}

export async function addBankAccountRequest(
  payload: BankAccountPayload,
): Promise<BankAccountDto> {
  const formData = buildBankAccountFormData(payload)
  return apiClient.post<BankAccountDto>("/api/store/bank-accounts", formData)
}

export async function updateBankAccountRequest(
  id: string,
  payload: BankAccountPayload,
): Promise<BankAccountDto> {
  const formData = buildBankAccountFormData(payload)
  return apiClient.put<BankAccountDto>(`/api/store/bank-accounts/${id}`, formData)
}

export async function deleteBankAccountRequest(id: string): Promise<void> {
  return apiClient.delete(`/api/store/bank-accounts/${id}`)
}

export async function getCitiesRequest(): Promise<CityDto[]> {
  return apiClient.get<CityDto[]>("/api/cities")
}

export async function addCityRequest(payload: { name: string }): Promise<CityDto> {
  return apiClient.post<CityDto>("/api/cities", payload)
}

export async function deleteCityRequest(id: number): Promise<void> {
  return apiClient.delete(`/api/cities/${id}`)
}