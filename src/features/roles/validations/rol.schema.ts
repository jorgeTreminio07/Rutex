import { z } from "zod"

export const roleFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
  description: z
    .string()
    .max(255, "Máximo 255 caracteres")
    .optional()
    .or(z.literal("")),
})

export type RoleFormValues = z.infer<typeof roleFormSchema>