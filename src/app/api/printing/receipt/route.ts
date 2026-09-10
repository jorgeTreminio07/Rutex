import { badRequest, ok, serverError } from "@/lib/api-response"
import { getAssetUrl } from "@/lib/assets"
import { createAdminClient } from "@/lib/supabase/admin"

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "rutex-storage"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) return badRequest("No se recibió el archivo PDF")

  const orderNumber = formData.get("orderNumber")?.toString() ?? ""
  const slug = orderNumber.replace(/[^A-Za-z0-9-]/g, "") || "recibo"
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 8)}`
  const path = `receipts/recibo-${slug}-${stamp}.pdf`

  const admin = createAdminClient()
  const { data, error } = await admin.storage.from(BUCKET).upload(path, await file.arrayBuffer(), {
    contentType: "application/pdf",
    cacheControl: "3600",
    upsert: false,
  })

  if (error) return serverError(error)

  return ok({
    url: getAssetUrl(data?.path ?? path),
  })
}