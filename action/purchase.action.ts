"use server";

import { Prisma } from "@/generated/prisma/client";

import {
  getPurchasesRepo,
  getPurchaseByIdRepo,
  createPurchaseRepo,
} from "@/repository/purchase.repository";

import { getCurrentUser } from "@/lib/auth/current-user";

type PurchaseItemInput = {
  productId: number;
  quantity: number;
  unitCost: number;
};

type CreatePurchaseInput = {
  total: number;
  paymentType?: string;
  supplierName?: string;
  notes?: string;
  items: PurchaseItemInput[];
};

export async function getPurchases() {
  try {
    const purchases = await getPurchasesRepo();

    return {
      success: true as const,
      purchases,
    };
  } catch (error) {
    console.error("Error obteniendo compras:", error);

    return {
      success: false as const,
      error: "No se pudieron cargar las compras.",
    };
  }
}

export async function getPurchaseById(id: number) {
  try {
    const purchase = await getPurchaseByIdRepo(id);

    if (!purchase) {
      return {
        success: false as const,
        error: "La compra no existe.",
      };
    }

    return {
      success: true as const,
      purchase,
    };
  } catch (error) {
    console.error("Error obteniendo compra:", error);

    return {
      success: false as const,
      error: "No se pudo obtener la compra.",
    };
  }
}

export async function createPurchase(data: CreatePurchaseInput) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    if (data.items.length === 0) {
      return {
        success: false as const,
        error: "La compra debe tener al menos un producto.",
      };
    }

    const purchase = await createPurchaseRepo({
      ...data,
      userId: user.id,
    });

    return {
      success: true as const,
      purchase,
    };
  } catch (error) {
    console.error("Error creando compra:", error);

    // Compra a crédito sin proveedor
    if (error instanceof Error && error.message === "SUPPLIER_REQUIRED") {
      return {
        success: false as const,
        error: "Debes indicar el proveedor para una compra a crédito.",
      };
    }

    // Producto inexistente
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return {
        success: false as const,
        error: "Uno de los productos seleccionados no existe.",
      };
    }

    // Producto inactivo
    if (error instanceof Error && error.message === "PRODUCT_INACTIVE") {
      return {
        success: false as const,
        error: "Uno de los productos seleccionados está inactivo.",
      };
    }

    // No existe una caja activa
    if (error instanceof Error && error.message === "CASHBOX_NOT_FOUND") {
      return {
        success: false as const,
        error: "No tienes una caja activa para realizar esta compra.",
      };
    }

    // Saldo insuficiente
    if (error instanceof Error && error.message === "INSUFFICIENT_BALANCE") {
      return {
        success: false as const,
        error:
          "El saldo de la caja no es suficiente para realizar esta compra.",
      };
    }

    // Error conocido de Prisma
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false as const,
        error: "No se pudo completar la compra.",
      };
    }

    // Error general
    return {
      success: false as const,
      error: "No se pudo crear la compra.",
    };
  }
}
