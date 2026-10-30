import { z } from "zod";
import { UnitType } from "@/lib/types";

// Presentaciones del producto
export const productPresentationSchema = z.object({
  name: z.string().trim().min(1, "El nombre de la presentación es obligatorio"),

  factor: z
    .number()
    .finite("El factor debe ser un número válido")
    .positive("El factor debe ser mayor que 0"),

  canPurchase: z.boolean().default(true),

  canSell: z.boolean().default(true),

  active: z.boolean().default(true),
});

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

  // Unidad base del inventario
  unit: z.string().trim().min(1, "La unidad es obligatoria").default("unidad"),

  // Familia de unidad utilizada para las conversiones
  unitType: z.nativeEnum(UnitType).default(UnitType.UNIT),

  price: z.number().positive("El precio debe ser mayor a 0"),

  costPrice: z
    .number()
    .nonnegative("El precio de costo no puede ser negativo")
    .optional(),

  categoryId: z.number().int().positive().optional(),

  // El inventario admite cantidades fraccionarias
  stock: z
    .number()
    .finite("El stock debe ser un número válido")
    .nonnegative("El stock no puede ser negativo")
    .default(0),

  minStock: z
    .number()
    .finite("El stock mínimo debe ser un número válido")
    .nonnegative("El stock mínimo no puede ser negativo")
    .default(0),

  active: z.boolean().default(true),

  // Presentaciones disponibles del producto
  presentations: z
    .array(productPresentationSchema)
    .min(1, "Debes añadir al menos una presentación"),
});

export type ProductPresentationFormData = z.infer<
  typeof productPresentationSchema
>;

export type ProductFormInput = z.input<typeof productSchema>;

export type ProductFormData = z.output<typeof productSchema>;
