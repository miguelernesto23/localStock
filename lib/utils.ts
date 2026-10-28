export { cn } from "cn";

import { Product } from "@/generated/prisma/client";
// Parcear Precios del Producto
export function getStockStatus(p: Product) {
  const min = p.minStock ?? 0;
  const stock = p.stock ?? 0;

  if (stock <= min) return "low";

  // 'near' when stock is within 50% above minStock (or at least 1)
  const nearThreshold = min + Math.max(1, Math.ceil(min * 0.5));
  if (stock <= nearThreshold) return "near";

  return "ok";
}
export function generateLotPrefix(productName: string): string {
  return productName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .join("");
}
