import prisma from "@/lib/prisma";

// Obtener todos los productos
export async function getProductsRepo() {
  return prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      category: true,
    },
  });
}

// Obtener un producto por ID
export async function getProductByIdRepo(id: number) {
  return prisma.product.findUnique({
    where: {
      id,
    },
    include: {
      category: true,
    },
  });
}

// Crear producto
export async function createProductRepo(data: {
  name: string;
  barcode?: string;
  description?: string;
  unit: string;
  price: number;
  costPrice?: number;
  categoryId?: number;
  stock?: number;
  minStock?: number;
  active?: boolean;
}) {
  return prisma.product.create({
    data: {
      name: data.name,
      barcode: data.barcode,
      description: data.description,
      unit: data.unit,
      price: data.price,
      costPrice: data.costPrice ?? 0,
      categoryId: data.categoryId,
      stock: data.stock ?? 0,
      minStock: data.minStock ?? 0,
      active: data.active ?? true,
    },
    include: {
      category: true,
    },
  });
}

// Actualizar producto
export async function updateProductRepo(
  id: number,
  data: {
    name: string;
    barcode?: string;
    description?: string;
    unit: string;
    price: number;
    costPrice?: number;
    categoryId?: number;
    stock?: number;
    minStock?: number;
    active?: boolean;
  },
) {
  return prisma.product.update({
    where: {
      id,
    },
    data: {
      name: data.name,
      barcode: data.barcode,
      description: data.description,
      unit: data.unit,
      price: data.price,
      costPrice: data.costPrice,
      categoryId: data.categoryId,
      stock: data.stock,
      minStock: data.minStock,
      active: data.active,
    },
    include: {
      category: true,
    },
  });
}

// Eliminar producto
export async function deleteProductRepo(id: number) {
  const product = await prisma.product.findUnique({
    where: {
      id,
    },
  });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  await prisma.product.delete({
    where: {
      id,
    },
  });

  return id;
}

// Activar / desactivar producto
export async function toggleProductActiveRepo(id: number, active: boolean) {
  return prisma.product.update({
    where: {
      id,
    },
    data: {
      active,
    },
    include: {
      category: true,
    },
  });
}
