import { apiClient } from "@/lib/api-client"

export async function uploadReceiptRequest(
  pdf: Blob,
  orderNumber: string,
): Promise<{ url: string }> {
  const form = new FormData()
  form.append("file", pdf, "recibo.pdf")
  form.append("orderNumber", orderNumber)
  return apiClient.post<{ url: string }>("/api/printing/receipt", form)
}