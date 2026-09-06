import { badRequest, created, serverError } from "@/lib/api-response"
import { getAssetUrl } from "@/lib/assets"
import { requireAdmin } from "@/lib/server/guards"
import { uploadToStorage } from "@/lib/server/storage"

const MAX_BYTES = 10 * 1024 * 1024

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
  return slug || "producto"
}

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response!

  const formData = await request.formData()
  const file = formData.get("file")
  const name = String(formData.get("name") ?? "").trim()

  if (!(file instanceof File)) return badRequest("Se requiere un archivo de imagen")
  if (!file.type.startsWith("image/")) return badRequest("El archivo debe ser una imagen")
  if (file.size > MAX_BYTES) return badRequest("La imagen no puede superar los 10 MB")

  const path = await uploadToStorage(file, "productos", slugify(name), `${Date.now()}`)
  if (!path) return serverError(new Error("No se pudo subir la imagen"))

  return created({ url: getAssetUrl(path), path })
}