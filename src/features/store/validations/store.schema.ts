import { z } from "zod"

const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const optionalText = (max: number, message = `Máximo ${max} caracteres`) =>
  z.string().max(max, message).optional().or(z.literal(""))

const optionalImageFile = (label: string) =>
  z
    .instanceof(File)
    .refine((file) => file.size <= MAX_IMAGE_SIZE, `${label} no debe superar 5 MB`)
    .refine((file) => file.type.startsWith("image/"), `${label} debe ser una imagen`)
    .optional()

export const storeFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(255, "Máximo 255 caracteres"),
  ownerName: optionalText(255),
  ruc: optionalText(50),
  email: z
    .string()
    .email("El correo no es válido")
    .max(255, "Máximo 255 caracteres")
    .optional()
    .or(z.literal("")),
  address: optionalText(500),
  phone: optionalText(50),
  workingHours: optionalText(255),
  paymentPlansEnabled: z.boolean(),
  logo: optionalImageFile("El logo"),
  stamp: optionalImageFile("El sello"),
  signature: optionalImageFile("La firma"),
  removeLogo: z.boolean().optional(),
  removeStamp: z.boolean().optional(),
  removeSignature: z.boolean().optional(),
})

export type StoreFormValues = z.infer<typeof storeFormSchema>

export const CURRENCY_OPTIONS = [
  { value: "C$", label: "Córdoba (C$)" },
  { value: "$", label: "Dólar ($)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "Billetera móvil", label: "Billetera móvil" },
] as const

export const bankAccountFormSchema = z.object({
  bankName: z.string().min(1, "El banco es obligatorio").max(255, "Máximo 255 caracteres"),
  currency: z.string().min(1, "Selecciona una moneda"),
  accountNumber: z.string().max(100, "Máximo 100 caracteres").optional().or(z.literal("")),
  accountHolder: z.string().min(1, "El titular es obligatorio").max(255, "Máximo 255 caracteres"),
  lastFourDigits: z.string().max(4, "Máximo 4 caracteres").optional(),
  qrCode: optionalImageFile("El QR"),
  removeQr: z.boolean().optional(),
})

export type BankAccountFormValues = z.infer<typeof bankAccountFormSchema>