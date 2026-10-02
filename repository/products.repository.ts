import prisma from "@/lib/prisma";

// Obtener todos los productos del usuario
export async function getProductsRepo(userId: number) {
  return prisma.product.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      category: true,
    },
  });
}

// Obtener un producto por ID perteneciente al usuario
export async function getProductByIdRepo(id: number, userId: number) {
  return prisma.product.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      category: true,
    },
  });
}

// Crear producto
export async function createProductRepo(data: {
  userId: number;
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
      userId: data.userId,
      name: data.name,
      barcode: data.barcode || null,
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
  userId: number,
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
  const product = await prisma.product.findFirst({
    where: {
      id,
      userId,
    },
  });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  return prisma.product.update({
    where: {
      id,
    },
    data: {
      name: data.name,
      barcode: data.barcode || null,
      description: data.description,
      unit: data.unit,
      price: data.price,
      costPrice: data.costPrice ?? 0,
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
export async function deleteProductRepo(id: number, userId: number) {
  const product = await prisma.product.findFirst({
    where: {
      id,
      userId,
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
export async function toggleProductActiveRepo(
  id: number,
  userId: number,
  active: boolean,
) {
  const result = await prisma.product.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      active,
    },
  });

  if (result.count === 0) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  return prisma.product.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      category: true,
    },
  });
}
export async function getBestSellingProductsRepo(userId: number) {
  const products = await prisma.product.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      saleItems: {
        select: {
          quantity: true,
        },
      },
    },
  });

  return products
    .map((product) => ({
      id: product.id,
      name: product.name,
      sold: product.saleItems.reduce((total, item) => total + item.quantity, 0),
    }))
    .filter((product) => product.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);
}
