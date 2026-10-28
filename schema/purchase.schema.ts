
import { z } from "zod";

export const purchaseItemSchema = z.object({
  productId: z.number().int().positive(),

  quantity: z
    .number()
    .int("La cantidad debe ser un número entero")
    .positive("La cantidad debe ser mayor que 0"),

  unitCost: z
    .number()
    .nonnegative("El costo unitario no puede ser negativo"),

  lotCode: z
    .string()
    .trim()
    .max(100, "El código del lote es demasiado largo")
    .optional()
    .or(z.literal("")),

  purchaseDate: z
    .string()
    .optional()
    .or(z.literal("")),
});

export const purchaseSchema = z.object({
  supplierName: z
    .string()
    .trim()
    .max(100, "El nombre del proveedor es demasiado largo")
    .optional()
    .or(z.literal("")),

  paymentType: z
    .enum(["EFECTIVO", "TRANSFERENCIA", "CREDITO"])
    .optional()
    .or(z.literal("")),

  notes: z
    .string()
    .trim()
    .max(500, "Las notas son demasiado largas")
    .optional()
    .or(z.literal("")),

  items: z
    .array(purchaseItemSchema)
    .min(1, "Debes añadir al menos un producto"),
});

export type PurchaseItemFormData = z.infer<typeof purchaseItemSchema>;
export type PurchaseFormData = z.infer<typeof purchaseSchema>;
