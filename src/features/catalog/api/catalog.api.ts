import { apiClient } from "@/lib/api-client"
import type { BankAccountInfo } from "@/features/catalog/lib/whatsapp"
import type { ProductDto } from "@/types/interfaces/product.interface"

export interface CatalogStoreInfo {
  name: string
  logoUrl: string | null
  phone: string | null
  paymentPlansEnabled: boolean
}

export interface CatalogData {
  products: ProductDto[]
  store: CatalogStoreInfo
  bankAccounts: BankAccountInfo[]
}

export async function getCatalogRequest(): Promise<CatalogData> {
  return apiClient.get<CatalogData>("/api/catalog")
}

export async function uploadProformaRequest(pdf: Blob, customerId: string): Promise<{ url: string }> {
  const form = new FormData()
  form.append("file", pdf, "proforma.pdf")
  form.append("customerId", customerId)
  return apiClient.post<{ url: string }>("/api/catalog/proforma", form)
}