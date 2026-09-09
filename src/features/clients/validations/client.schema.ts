import { z } from "zod"

export const clientSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "El nombre del cliente es obligatorio")
      .max(255, "Máximo 255 caracteres"),
    phone: z
      .string()
      .trim()
      .min(1, "El teléfono es obligatorio")
      .max(20, "Máximo 20 caracteres"),
    cedula: z
      .string()
      .trim()
      .max(40, "Máximo 40 caracteres")
      .refine((value) => !/[-]/.test(value), "La cédula no debe llevar guiones")
      .optional()
      .or(z.literal("")),
    address: z.string().trim().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
    city: z.string().trim().max(255, "Máximo 255 caracteres").optional().or(z.literal("")),
    latitude: z
      .preprocess(
        (value) => (value === "" || value == null ? null : Number(value)),
        z.number().min(-90, "Latitud fuera de rango").max(90, "Latitud fuera de rango"),
      )
      .nullable()
      .optional(),
    longitude: z
      .preprocess(
        (value) => (value === "" || value == null ? null : Number(value)),
        z.number().min(-180, "Longitud fuera de rango").max(180, "Longitud fuera de rango"),
      )
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if ((data.latitude == null) !== (data.longitude == null)) {
      ctx.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "Ingresa ambas coordenadas (latitud y longitud)",
      })
    }
  })

export type ClientFormValues = z.output<typeof clientSchema>