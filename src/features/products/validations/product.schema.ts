import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  purchasePrice: z.coerce.number().min(0, "El precio compra debe ser positivo"),
  price: z.coerce.number().min(0, "El precio venta debe ser positivo"),
  discountPercent: z.coerce.number().min(0).max(100),
  category: z.string().min(1, "La categoría es obligatoria"),
  images: z.array(z.string()).optional(),
})

export type ProductFormData = z.infer<typeof productSchema>

export const imageUploadSchema = z.object({
  file: z.instanceof(File).refine((f) => f.type.startsWith("image/"), "Debe ser una imagen"),
  name: z.string().min(1, "El nombre es obligatorio"),
})

export type ImageUploadFormData = z.infer<typeof imageUploadSchema>

export const orderStatusSchema = z.object({
  statusId: z.number().refine((v) => [5, 6, 7].includes(v), "Estado inválido"),
})

export type OrderStatusFormData = z.infer<typeof orderStatusSchema>
