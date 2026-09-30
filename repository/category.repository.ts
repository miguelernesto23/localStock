import prisma from "@/lib/prisma";

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });
}

export async function createCategoryRepo(data: {
  name: string;
  description?: string;
  active?: boolean;
}) {
  return prisma.category.create({
    data: {
      name: data.name,
      description: data.description,
      active: data.active ?? true,
    },
  });
}

export async function updateCategoryRepo(
  id: number,
  data: {
    name: string;
    description?: string;
    active?: boolean;
  },
) {
  return prisma.category.update({
    where: {
      id,
    },
    data: {
      name: data.name,
      description: data.description,
      active: data.active,
    },
  });
}
// Deelete category
export async function deleteCategoryRepo(id: number) {
  const category = await prisma.category.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  if (!category) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  if (category._count.products > 0) {
    throw new Error("CATEGORY_HAS_PRODUCTS");
  }

  await prisma.category.delete({
    where: {
      id,
    },
  });

  return id;
}
// Activar o desactivar categoria
export async function toggleCategoryActiveRepo(
  id: number,
  active: boolean
) {
  return prisma.category.update({
    where: {
      id,
    },
    data: {
      active,
    },
  });
}