"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { createSaleRepo, getSaleByIdRepo, getSalesRepo } from "@/repository/sale.repository";

type SaleItemInput = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

type CreateSaleInput = {
  paymentType: "EFECTIVO" | "TRANSFERENCIA" | "CREDITO";
  items: SaleItemInput[];
};

export async function createSale(data: CreateSaleInput) {
  try {
    // -----------------------------------------
    // 1. Verificar autenticación
    // -----------------------------------------

    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    // -----------------------------------------
    // 2. Validaciones básicas
    // -----------------------------------------

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

    // -----------------------------------------
    // 3. Crear venta
    // -----------------------------------------

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

    // -----------------------------------------
    // Errores de negocio
    // -----------------------------------------

    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND") {
      return {
        success: false as const,
        error: "Uno de los productos seleccionados no existe.",
      };
    }

    if (error instanceof Error && error.message === "PRODUCT_INACTIVE") {
      return {
        success: false as const,
        error: "Uno de los productos seleccionados está inactivo.",
      };
    }

    if (
      error instanceof Error &&
      error.message.startsWith("INSUFFICIENT_STOCK:")
    ) {
      const productName = error.message.split(":")[1];

      return {
        success: false as const,
        error: `No hay suficiente stock de ${productName}.`,
      };
    }

    if (error instanceof Error && error.message === "INVALID_QUANTITY") {
      return {
        success: false as const,
        error: "La cantidad de uno de los productos no es válida.",
      };
    }

    if (error instanceof Error && error.message === "INVALID_PRICE") {
      return {
        success: false as const,
        error: "El precio de uno de los productos no es válido.",
      };
    }

    if (error instanceof Error && error.message === "CASHBOX_NOT_FOUND") {
      return {
        success: false as const,
        error: "No tienes una caja activa para registrar esta venta.",
      };
    }

    if (error instanceof Error && error.message === "EMPTY_SALE") {
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
//
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
