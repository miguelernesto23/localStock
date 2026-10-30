"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  createSaleRepo,
  getSaleByIdRepo,
  getSalesRepo,
} from "@/repository/sale.repository";

type LotAllocationInput = {
  lotId: number;
  quantity: number;
};

type SaleItemInput = {
  productId: number;
  quantity: number;
  unitPrice: number;
  lotAllocations?: LotAllocationInput[];
};

type CreateSaleInput = {
  paymentType: "EFECTIVO" | "TRANSFERENCIA" | "CREDITO";
  items: SaleItemInput[];
};

export async function createSale(data: CreateSaleInput) {
  try {
    // 1. Verificar autenticación

    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    // 2. Validar datos generales

    if (!data.items || data.items.length === 0) {
      return {
        success: false as const,
        error: "La venta debe tener al menos un producto.",
      };
    }

    if (!["EFECTIVO", "TRANSFERENCIA", "CREDITO"].includes(data.paymentType)) {
      return {
        success: false as const,
        error: "El método de pago no es válido.",
      };
    }

    // 3. Validar artículos y lotes seleccionados

    for (const item of data.items) {
      if (
        !Number.isInteger(item.productId) ||
        item.productId <= 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.unitPrice) ||
        item.unitPrice <= 0
      ) {
        return {
          success: false as const,
          error: "Hay un producto con datos no válidos.",
        };
      }

      if (item.lotAllocations !== undefined) {
        if (
          !Array.isArray(item.lotAllocations) ||
          item.lotAllocations.length === 0
        ) {
          return {
            success: false as const,
            error: "Debes seleccionar al menos un lote.",
          };
        }

        for (const allocation of item.lotAllocations) {
          if (
            !Number.isInteger(allocation.lotId) ||
            allocation.lotId <= 0 ||
            !Number.isInteger(allocation.quantity) ||
            allocation.quantity <= 0
          ) {
            return {
              success: false as const,
              error: "La selección de lotes contiene datos no válidos.",
            };
          }
        }

        const allocatedQuantity = item.lotAllocations.reduce(
          (sum, allocation) => sum + allocation.quantity,
          0,
        );

        if (allocatedQuantity !== item.quantity) {
          return {
            success: false as const,
            error:
              "La cantidad de los lotes no coincide con la cantidad de venta.",
          };
        }
      }
    }

    // 4. Crear venta

    const sale = await createSaleRepo({
      ...data,
      userId: user.id,
    });

    return {
      success: true as const,
      sale,
    };
  } catch (error) {
    console.error("Error creando venta:", error);

    if (!(error instanceof Error)) {
      return {
        success: false as const,
        error: "No se pudo registrar la venta.",
      };
    }

    // 5. Errores de negocio

    if (error.message === "PRODUCT_NOT_FOUND") {
      return {
        success: false as const,
        error: "Uno de los productos seleccionados no existe.",
      };
    }

    if (error.message === "PRODUCT_INACTIVE") {
      return {
        success: false as const,
        error: "Uno de los productos seleccionados está inactivo.",
      };
    }

    if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
      const productName = error.message.split(":")[1];

      return {
        success: false as const,
        error: `No hay suficiente stock de ${productName}.`,
      };
    }

    if (error.message.startsWith("INSUFFICIENT_LOT_STOCK:")) {
      const productName = error.message.split(":")[1];

      return {
        success: false as const,
        error: `No hay suficientes unidades disponibles en los lotes de ${productName}.`,
      };
    }

    if (error.message === "LOT_NOT_FOUND") {
      return {
        success: false as const,
        error:
          "Uno de los lotes seleccionados no existe o no pertenece al producto.",
      };
    }

    if (error.message === "INVALID_LOT_ALLOCATION") {
      return {
        success: false as const,
        error: "La selección de lotes no es válida.",
      };
    }

    if (error.message === "DUPLICATE_LOT_ALLOCATION") {
      return {
        success: false as const,
        error: "No puedes seleccionar dos veces el mismo lote.",
      };
    }

    if (error.message === "LOT_QUANTITY_MISMATCH") {
      return {
        success: false as const,
        error: "La cantidad asignada a los lotes no coincide con la venta.",
      };
    }

    if (error.message === "INVALID_QUANTITY") {
      return {
        success: false as const,
        error: "La cantidad de uno de los productos no es válida.",
      };
    }

    if (error.message === "INVALID_PRICE") {
      return {
        success: false as const,
        error: "El precio de uno de los productos no es válido.",
      };
    }

    if (error.message === "CASHBOX_NOT_FOUND") {
      return {
        success: false as const,
        error: "No tienes una caja activa para registrar esta venta.",
      };
    }

    if (error.message === "EMPTY_SALE") {
      return {
        success: false as const,
        error: "La venta debe tener al menos un producto.",
      };
    }

    return {
      success: false as const,
      error: "No se pudo registrar la venta.",
    };
  }
}

// ============================================================
// OBTENER TODAS LAS VENTAS
// ============================================================

export async function getSales() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    const sales = await getSalesRepo(user.id);

    return {
      success: true as const,
      sales,
    };
  } catch (error) {
    console.error("Error obteniendo ventas:", error);

    return {
      success: false as const,
      error: "No se pudieron cargar las ventas.",
    };
  }
}

// ============================================================
// OBTENER UNA VENTA POR ID
// ============================================================

export async function getSaleById(id: number) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    if (!Number.isInteger(id) || id <= 0) {
      return {
        success: false as const,
        error: "La venta no es válida.",
      };
    }

    const sale = await getSaleByIdRepo(id, user.id);

    if (!sale) {
      return {
        success: false as const,
        error: "La venta no existe.",
      };
    }

    return {
      success: true as const,
      sale,
    };
  } catch (error) {
    console.error("Error obteniendo venta:", error);

    return {
      success: false as const,
      error: "No se pudo obtener la venta.",
    };
  }
}
