import { z } from "zod"

const MAX_PHOTO_SIZE = 5 * 1024 * 1024

const optionalImageFile = (label: string) =>
  z
    .instanceof(File)
    .refine((file) => file.size <= MAX_PHOTO_SIZE, `${label} no debe superar 5 MB`)
    .refine((file) => file.type.startsWith("image/"), `${label} debe ser una imagen`)
    .optional()

const optionalText = (max = 255, message = `Máximo ${max} caracteres`) =>
  z.string().max(max, message).optional().or(z.literal(""))

export const userFormSchema = z.object({
  username: z.string().min(1, "El usuario es obligatorio").max(255, "Máximo 255 caracteres"),
  firstName: optionalText(),
  lastName: optionalText(),
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio")
    .email("El correo no es válido")
    .max(255, "Máximo 255 caracteres"),
  password: z
    .string()
    .min(6, "Mínimo 6 caracteres")
    .max(255, "Máximo 255 caracteres")
    .optional()
    .or(z.literal("")),
  roleId: z.string().min(1, "Selecciona un rol"),
  statusId: z.number(),
  photo: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_PHOTO_SIZE, "La imagen no debe superar 5 MB")
    .refine((file) => file.type.startsWith("image/"), "Solo se permiten imágenes")
    .optional(),
  signature: optionalImageFile("La firma"),
  removeSignature: z.boolean().optional(),
})

export type UserFormValues = z.infer<typeof userFormSchema>