import { z } from "zod";

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede superar los 50 caracteres"),

  description: z
    .string()
    .max(200, "La descripción no puede superar los 200 caracteres")
    .optional(),

  active: z.boolean().default(true),
});

export type CategoryFormData = z.infer<typeof categorySchema>;