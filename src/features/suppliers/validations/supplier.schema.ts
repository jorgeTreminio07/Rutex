import { z } from "zod"

export const supplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre del proveedor es obligatorio")
    .max(255, "Máximo 255 caracteres"),
  ruc: z
    .string()
    .trim()
    .min(1, "El RUC es obligatorio")
    .max(30, "Máximo 30 caracteres"),
  address: z.string().trim().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(1, "El teléfono es obligatorio")
    .max(20, "Máximo 20 caracteres"),
  ownerName: z
    .string()
    .trim()
    .max(255, "Máximo 255 caracteres")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .max(255, "Máximo 255 caracteres")
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Correo electrónico inválido"),
})

export type SupplierFormValues = z.output<typeof supplierSchema>