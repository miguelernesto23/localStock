import prisma from "@/lib/prisma";
import { UnitType } from "@/generated/prisma/client";

type ProductPresentationInput = {
  name: string;
  factor: number;
  canPurchase: boolean;
  canSell: boolean;
  active?: boolean;
};

type ProductInput = {
  userId: number;
  name: string;
  barcode?: string;
  description?: string;
  unit: string;
  unitType?: UnitType;
  price: number;
  costPrice?: number;
  categoryId?: number;
  stock?: number;
  minStock?: number;
  active?: boolean;
  presentations: ProductPresentationInput[];
};

// Obtener todos los productos del usuario
export async function getProductsRepo(userId: number) {
  return prisma.product.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      category: true,
      presentations: {
        where: {
          active: true,
          canPurchase: true,
        },
      },
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
      presentations: true,
    },
  });
}

// Crear producto junto con sus presentaciones
export async function createProductRepo(data: ProductInput) {
  return prisma.product.create({
    data: {
      userId: data.userId,
      name: data.name,
      barcode: data.barcode || null,
      description: data.description,
      unit: data.unit,
      unitType: data.unitType ?? UnitType.UNIT,
      price: data.price,
      costPrice: data.costPrice ?? 0,
      categoryId: data.categoryId,
      stock: data.stock ?? 0,
      minStock: data.minStock ?? 0,
      active: data.active ?? true,

      presentations: {
        create: data.presentations,
      },
    },
    include: {
      category: true,
      presentations: true,
    },
  });
}

// Actualizar producto y reemplazar sus presentaciones
export async function updateProductRepo(
  id: number,
  userId: number,
  data: Omit<ProductInput, "userId">,
) {
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    return tx.product.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        barcode: data.barcode || null,
        description: data.description,
        unit: data.unit,
        unitType: data.unitType ?? product.unitType,
        price: data.price,
        costPrice: data.costPrice ?? 0,
        categoryId: data.categoryId,
        stock: data.stock,
        minStock: data.minStock,
        active: data.active,

        presentations: {
          deleteMany: {},
          create: data.presentations,
        },
      },
      include: {
        category: true,
        presentations: true,
      },
    });
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
    where: { id },
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
      presentations: true,
    },
  });
}

// Obtener los 5 productos más vendidos del usuario
export async function getBestSellingProductsRepo(userId: number) {
  const products = await prisma.product.findMany({
    where: {
      userId,
    },
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
// Obtener productos con lotes disponibles para registrar ventas
export async function getProductsWithLotsForSaleRepo(userId: number) {
  return prisma.product.findMany({
    where: {
      userId,
      active: true,
      stock: {
        gt: 0,
      },
    },
    select: {
      id: true,
      name: true,
      barcode: true,
      price: true,
      stock: true,
      unit: true,
      unitType: true,

      lots: {
        where: {
          availableQuantity: {
            gt: 0,
          },
        },
        orderBy: [
          {
            purchaseDate: "asc",
          },
          {
            id: "asc",
          },
        ],
        select: {
          id: true,
          lotCode: true,
          purchaseDate: true,
          availableQuantity: true,
          unitCost: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}
