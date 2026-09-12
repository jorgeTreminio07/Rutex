import { badRequest, created, serverError } from "@/lib/api-response"
import { getAssetUrl } from "@/lib/assets"
import { requireAdmin } from "@/lib/server/guards"
import { uploadToStorage } from "@/lib/server/storage"

const MAX_BYTES = 15 * 1024 * 1024
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
  return slug || "recibo"
}

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const formData = await request.formData()
  const file = formData.get("file")
  const name = String(formData.get("name") ?? "").trim()

  if (!(file instanceof File)) return badRequest("Se requiere un archivo de recibo")
  if (!ALLOWED_TYPES.includes(file.type)) {
    return badRequest("El recibo debe ser una imagen o un PDF")
  }
  if (file.size > MAX_BYTES) return badRequest("El recibo no puede superar los 15 MB")

  const path = await uploadToStorage(file, "compras", slugify(name || "recibo"), `${Date.now()}`)
  if (!path) return serverError(new Error("No se pudo subir el recibo"))

  return created({ url: getAssetUrl(path), path })
}