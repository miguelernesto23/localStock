import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  barcode: z
    .string()
    .regex(/^\d{13}$/, "El código de barras debe tener exactamente 13 números"),
  description: z
    .string()
    .trim()
    .max(500, "La descripción es demasiado larga")
    .optional()
    .or(z.literal("")),

  unit: z.string().trim().min(1, "La unidad es obligatoria").default("unidad"),

  price: z.number().positive("El precio debe ser mayor a 0"),

  costPrice: z
    .number()
    .nonnegative("El precio de costo no puede ser negativo")
    .optional(),

  categoryId: z.number().int().positive().optional(),

  stock: z
    .number()
    .int("El stock debe ser un número entero")
    .nonnegative("El stock no puede ser negativo")
    .default(0),

  minStock: z
    .number()
    .int("El stock mínimo debe ser un número entero")
    .nonnegative("El stock mínimo no puede ser negativo")
    .default(0),

  active: z.boolean().default(true),
});

export type ProductFormInput = z.input<typeof productSchema>;
export type ProductFormData = z.output<typeof productSchema>;
