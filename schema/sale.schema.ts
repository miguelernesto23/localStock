import { z } from "zod";

export const saleItemSchema = z.object({
  productId: z.number().int().positive(),

  quantity: z
    .number()
    .int("La cantidad debe ser un número entero")
    .positive("La cantidad debe ser mayor que 0"),

  unitPrice: z
    .number()
    .positive("El precio debe ser mayor que 0"),
});

export const saleSchema = z.object({
  paymentType: z.enum(["EFECTIVO", "TRANSFERENCIA", "CREDITO"]),

  items: z
    .array(saleItemSchema)
    .min(1, "La venta debe tener al menos un producto"),
});

export type SaleItemFormData = z.infer<typeof saleItemSchema>;

export type SaleFormData = z.infer<typeof saleSchema>;  