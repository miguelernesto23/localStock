"use server";

import type { Category } from "@/generated/prisma/client";
import {
  getCategories,
  createCategoryRepo,
  updateCategoryRepo,
  deleteCategoryRepo,
  toggleCategoryActiveRepo,
} from "@/repository/category.repository";
import {
  categorySchema,
  type CategoryFormData,
} from "@/schema/category.schema";
import { Prisma } from "@/generated/prisma/client";

type CategoriesResult =
  | {
      success: true;
      categories: (Category & {
        _count?: {
          products?: number;
        };
      })[];
    }
  | {
      success: false;
      error: string;
    };
// Obtener todas las categorias
export async function CategoriesAllAction(): Promise<CategoriesResult> {
  try {
    const categories = await getCategories();

    return {
      success: true,
      categories,
    };
  } catch (error) {
    console.error("Error obteniendo categorías:", error);

    return {
      success: false,
      error: "No se pudieron cargar las categorías",
    };
  }
}

//
// Crear Category
export async function createCategory(data: CategoryFormData) {
  try {
    const parsed = categorySchema.parse(data);

    const category = await createCategoryRepo(parsed);

    return {
      success: true as const,
      category,
    };
  } catch (error) {
    console.error("Error creando categoría:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false as const,
        error: "Ya existe una categoría con ese nombre.",
      };
    }

    return {
      success: false as const,
      error: "No se pudo crear la categoría.",
    };
  }
}
// Editar Category
export async function updateCategory(id: number, data: CategoryFormData) {
  try {
    const parsed = categorySchema.parse(data);

    const category = await updateCategoryRepo(id, parsed);

    return {
      success: true as const,
      category,
    };
  } catch (error) {
    console.error("Error actualizando categoría:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false as const,
        error: "Ya existe una categoría con ese nombre.",
      };
    }

    return {
      success: false as const,
      error: "No se pudo actualizar la categoría.",
    };
  }
}
// Delete
export async function deleteCategory(id: number) {
  try {
    const categoryId = await deleteCategoryRepo(id);

    return {
      success: true as const,
      categoryId,
    };
  } catch (error) {
    console.error("Error eliminando categoría:", error);

    if (error instanceof Error && error.message === "CATEGORY_HAS_PRODUCTS") {
      return {
        success: false as const,
        error:
          "No se puede eliminar la categoría porque tiene productos asociados.",
      };
    }

    if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") {
      return {
        success: false as const,
        error: "La categoría no existe.",
      };
    }

    return {
      success: false as const,
      error: "No se pudo eliminar la categoría.",
    };
  }
}
// Desactivar Categoria
export async function toggleCategoryActive(id: number, active: boolean) {
  try {
    const category = await toggleCategoryActiveRepo(id, active);

    return {
      success: true as const,
      category,
    };
  } catch (error) {
    console.error("Error cambiando estado de categoría:", error);

    return {
      success: false as const,
      error: "No se pudo cambiar el estado de la categoría",
    };
  }
}
