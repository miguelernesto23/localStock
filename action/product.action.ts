"use server";

import { Prisma } from "@/generated/prisma/client";

import {
  getProductsRepo,
  getProductByIdRepo,
  createProductRepo,
  updateProductRepo,
  deleteProductRepo,
  toggleProductActiveRepo,
} from "@/repository/products.repository";

import { productSchema, type ProductFormData } from "@/schema/product.schema";

// ─────────────────────────────────────────────
// Obtener todos los productos
// ─────────────────────────────────────────────

export async function getProducts() {
  try {
    const products = await getProductsRepo();

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
    const product = await getProductByIdRepo(id);

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
    const parsed = productSchema.parse(data);

    const product = await createProductRepo(parsed);

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
    const parsed = productSchema.parse(data);

    const product = await updateProductRepo(id, parsed);

    return {
      success: true as const,
      product,
    };
  } catch (error) {
    console.error("Error actualizando producto:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        success: false as const,
        error: "Ya existe un producto con ese código de barras.",
      };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false as const,
        error: "El producto no existe.",
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
    const productId = await deleteProductRepo(id);

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
    const product = await toggleProductActiveRepo(id, active);

    return {
      success: true as const,
      product,
    };
  } catch (error) {
    console.error("Error cambiando estado del producto:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false as const,
        error: "El producto no existe.",
      };
    }

    return {
      success: false as const,
      error: "No se pudo cambiar el estado del producto.",
    };
  }
}
