export type CreateProductInput = {
  name: string;
  barcode?: string;
  description?: string;
  unit: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  categoryId?: number;
  active?: boolean;
};

export type UpdateProductInput = {
  id: number;
} & Partial<CreateProductInput>;
export const UnitType = {
  UNIT: "UNIT",
  GRAM: "GRAM",
  MILLILITER: "MILLILITER",
} as const;

export type UnitType = (typeof UnitType)[keyof typeof UnitType];

import type { Prisma } from "@/generated/prisma/client";

export type ProductWithCategory = Prisma.ProductGetPayload<{
  include: {
    category: true;
    presentations: true;
  };
}>;
