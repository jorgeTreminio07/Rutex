import { z } from "zod"

export const compraSchema = z.object({
  title: z.string().trim().min(1, "El título de la compra es obligatorio"),
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

export type CompraFormValues = z.input<typeof compraSchema>
export type CompraFormOutput = z.output<typeof compraSchema>