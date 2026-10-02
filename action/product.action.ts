"use server";

import { Prisma } from "@/generated/prisma/client";
import { cookies } from "next/headers";

import {
  getProductsRepo,
  getProductByIdRepo,
  createProductRepo,
  updateProductRepo,
  deleteProductRepo,
  toggleProductActiveRepo,
  getBestSellingProductsRepo,
} from "@/repository/products.repository";

import { productSchema, type ProductFormData } from "@/schema/product.schema";

import { verifySession } from "@/lib/auth/session";

// ─────────────────────────────────────────────
// Obtener usuario autenticado
// ─────────────────────────────────────────────

async function getAuthenticatedUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("Sesion")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);

  if (!session || typeof session.userId !== "number") {
    return null;
  }

  return session.userId;
}

// ─────────────────────────────────────────────
// Obtener todos los productos
// ─────────────────────────────────────────────

export async function getProducts() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    const products = await getProductsRepo(userId);

    return {
      success: true as const,
      products,
    };
  } catch (error) {
    console.error("Error obteniendo productos:", error);

    return {
      success: false as const,
      error: "No se pudieron cargar los productos.",
    };
  }
}

// ─────────────────────────────────────────────
// Obtener producto por ID
// ─────────────────────────────────────────────

export async function getProductById(id: number) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    const product = await getProductByIdRepo(id, userId);

    if (!product) {
      return {
        success: false as const,
        error: "El producto no existe.",
      };
    }

    return {
      success: true as const,
      product,
    };
  } catch (error) {
    console.error("Error obteniendo producto:", error);

    return {
      success: false as const,
      error: "No se pudo obtener el producto.",
    };
  }
}

// ─────────────────────────────────────────────
// Crear producto
// ─────────────────────────────────────────────

export async function createProduct(data: ProductFormData) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    const parsed = productSchema.parse(data);

    const product = await createProductRepo({
      ...parsed,
      userId,
    });

    return {
      success: true as const,
      product,
    };
  } catch (error) {
    console.error("Error creando producto:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false as const,
        error: "Ya existe un producto con ese código de barras.",
      };
    }

    return {
      success: false as const,
      error: "No se pudo crear el producto.",
    };
  }
}

// ─────────────────────────────────────────────
// Actualizar producto
// ─────────────────────────────────────────────

export async function updateProduct(id: number, data: ProductFormData) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    const parsed = productSchema.parse(data);

    const product = await updateProductRepo(id, userId, parsed);

    return {
      success: true as const,
      product,
    };
  } catch (error) {
    console.error("Error actualizando producto:", error);

    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return {
        success: false as const,
        error: "El producto no existe.",
      };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false as const,
        error: "Ya existe un producto con ese código de barras.",
      };
    }

    return {
      success: false as const,
      error: "No se pudo actualizar el producto.",
    };
  }
}

// ─────────────────────────────────────────────
// Eliminar producto
// ─────────────────────────────────────────────

export async function deleteProduct(id: number) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    const productId = await deleteProductRepo(id, userId);

    return {
      success: true as const,
      productId,
    };
  } catch (error) {
    console.error("Error eliminando producto:", error);

    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return {
        success: false as const,
        error: "El producto no existe.",
      };
    }

    return {
      success: false as const,
      error: "No se pudo eliminar el producto.",
    };
  }
}

// ─────────────────────────────────────────────
// Activar / desactivar producto
// ─────────────────────────────────────────────

export async function toggleProductActive(id: number, active: boolean) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    const product = await toggleProductActiveRepo(id, userId, active);

    if (!product) {
      return {
        success: false as const,
        error: "El producto no existe.",
      };
    }

    return {
      success: true as const,
      product,
    };
  } catch (error) {
    console.error("Error cambiando estado del producto:", error);

    return {
      success: false as const,
      error: "No se pudo cambiar el estado del producto.",
    };
  }
}
export async function getBestSellingProducts() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    const products = await getBestSellingProductsRepo(userId);

    return {
      success: true as const,
      products,
    };
  } catch (error) {
    console.error("Error obteniendo productos más vendidos:", error);

    return {
      success: false as const,
      error: "No se pudieron obtener los productos más vendidos.",
    };
  }
}
