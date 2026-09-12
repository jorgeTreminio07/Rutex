import { z } from "zod"

export const gastoSchema = z.object({
  title: z.string().trim().min(1, "El título del gasto es obligatorio"),
  observation: z.string().optional(),
  amount: z
    .string()
    .trim()
    .refine((v) => v !== "", "El monto es obligatorio")
    .refine((v) => {
      const n = Number(v)
      return Number.isFinite(n) && n >= 0
    }, "El monto debe ser un número mayor o igual a 0"),
})

export type GastoFormValues = z.input<typeof gastoSchema>
export type GastoFormOutput = z.output<typeof gastoSchema>