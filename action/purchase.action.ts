"use server";

import { Prisma } from "@/generated/prisma/client";
import { verifySession } from "@/lib/auth/session";
import { getCurrentUser } from "@/lib/auth/current-user";
import { cookies } from "next/headers";

import {
  getPurchasesRepo,
  getPurchaseByIdRepo,
  createPurchaseRepo,
} from "@/repository/purchase.repository";

import { purchaseSchema } from "@/schema/purchase.schema";

// --------------------------------------------------
// OBTENER COMPRAS
// --------------------------------------------------

export async function getPurchases() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("Sesion")?.value;

    if (!token) {
      return {
        success: false as const,
        error: "No autorizado.",
      };
    }

    const session = await verifySession(token);

    if (!session) {
      return {
        success: false as const,
        error: "Sesión inválida o expirada.",
      };
    }

    const purchases = await getPurchasesRepo(session.userId);

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

// --------------------------------------------------
// OBTENER COMPRA POR ID
// --------------------------------------------------

export async function getPurchaseById(id: number) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("Sesion")?.value;

    if (!token) {
      return {
        success: false as const,
        error: "No autorizado.",
      };
    }

    const session = await verifySession(token);

    if (!session) {
      return {
        success: false as const,
        error: "Sesión inválida o expirada.",
      };
    }

    const purchase = await getPurchaseByIdRepo(id);

    if (!purchase || purchase.userId !== session.userId) {
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

// --------------------------------------------------
// CREAR COMPRA
// --------------------------------------------------

export async function createPurchase(data: unknown) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    // Validar los datos recibidos.
    const validation = purchaseSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false as const,
        error:
          validation.error.issues[0]?.message ??
          "Los datos de la compra no son válidos.",
      };
    }

    const purchase = await createPurchaseRepo({
      ...validation.data,
      userId: user.id,
    });

    return {
      success: true as const,
      purchase,
    };
  } catch (error) {
    console.error("Error creando compra:", error);

    const errorMessages: Record<string, string> = {
      EMPTY_PURCHASE: "La compra debe tener al menos un producto.",
      SUPPLIER_REQUIRED:
        "Debes indicar el proveedor para una compra a crédito.",
      PRODUCT_NOT_FOUND: "Uno de los productos seleccionados no existe.",
      PRODUCT_INACTIVE: "Uno de los productos seleccionados está inactivo.",
      PRESENTATION_NOT_FOUND:
        "Una de las presentaciones seleccionadas no existe o no permite compras.",
      INVALID_QUANTITY: "Una de las cantidades introducidas no es válida.",
      INVALID_UNIT_COST: "Uno de los precios introducidos no es válido.",
      INVALID_PRESENTATION_FACTOR:
        "Una de las presentaciones tiene un factor de conversión inválido.",
      INVALID_LOT_CODE: "El código de uno de los lotes no es válido.",
      INVALID_PURCHASE_DATE: "Una de las fechas de compra no es válida.",
      INVALID_TOTAL: "El total de la compra no es válido.",
      CASHBOX_NOT_FOUND: "No tienes una caja activa para realizar esta compra.",
      INSUFFICIENT_BALANCE:
        "El saldo de la caja no es suficiente para realizar esta compra.",
    };

    if (error instanceof Error && errorMessages[error.message]) {
      return {
        success: false as const,
        error: errorMessages[error.message],
      };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return {
        success: false as const,
        error: "No se pudo completar la compra.",
      };
    }

    return {
      success: false as const,
      error: "No se pudo crear la compra.",
    };
  }
}
