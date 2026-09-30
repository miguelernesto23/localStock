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
