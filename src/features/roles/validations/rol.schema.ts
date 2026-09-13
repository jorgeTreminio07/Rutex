import { z } from "zod"
import { isValidPermission } from "@/lib/permissions"

export const roleFormSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
  description: z
    .string()
    .max(255, "Máximo 255 caracteres")
    .optional()
    .or(z.literal("")),
  permissions: z.array(z.string()).refine((perms) => perms.every(isValidPermission), {
    message: "Hay permisos inválidos en la lista",
  }),
})

export type RoleFormValues = z.infer<typeof roleFormSchema>