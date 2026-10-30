
import prisma from "@/lib/prisma";

type PurchaseItemInput = {
  productId: number;
  presentationId: number;
  purchasedQuantity: number;
  purchasedUnitCost: number;
  lotCode?: string;
  purchaseDate?: string;
};

type CreatePurchaseInput = {
  paymentType?: string;
  supplierName?: string;
  notes?: string;
  userId: number;
  items: PurchaseItemInput[];
};

export async function createPurchaseRepo(data: CreatePurchaseInput) {
  return prisma.$transaction(async (tx) => {
    // ========================================================
    // 1. VALIDACIONES GENERALES
    // ========================================================

    if (data.items.length === 0) {
      throw new Error("EMPTY_PURCHASE");
    }

    if (data.paymentType === "CREDITO" && !data.supplierName?.trim()) {
      throw new Error("SUPPLIER_REQUIRED");
    }

    // ========================================================
    // 2. VALIDAR PRODUCTOS Y PRESENTACIONES
    // ========================================================

    const preparedItems = [];

    for (const item of data.items) {
      if (
        !Number.isFinite(item.purchasedQuantity) ||
        item.purchasedQuantity <= 0
      ) {
        throw new Error("INVALID_QUANTITY");
      }

      if (
        !Number.isFinite(item.purchasedUnitCost) ||
        item.purchasedUnitCost < 0
      ) {
        throw new Error("INVALID_UNIT_COST");
      }

      if (item.lotCode !== undefined && !item.lotCode.trim()) {
        throw new Error("INVALID_LOT_CODE");
      }

      if (
        item.purchaseDate !== undefined &&
        item.purchaseDate !== "" &&
        Number.isNaN(Date.parse(item.purchaseDate))
      ) {
        throw new Error("INVALID_PURCHASE_DATE");
      }

      const sourceProduct = await tx.product.findFirst({
        where: {
          id: item.productId,
          userId: data.userId,
        },
      });

      if (!sourceProduct) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      if (!sourceProduct.active) {
        throw new Error("PRODUCT_INACTIVE");
      }

      const presentation = await tx.productPresentation.findFirst({
        where: {
          id: item.presentationId,
          productId: sourceProduct.id,
          active: true,
          canPurchase: true,
        },
      });

      if (!presentation) {
        throw new Error("PRESENTATION_NOT_FOUND");
      }

      if (
        !Number.isFinite(presentation.factor) ||
        presentation.factor <= 0
      ) {
        throw new Error("INVALID_PRESENTATION_FACTOR");
      }

      // Convertir la cantidad a unidades base.
      const baseQuantity =
        item.purchasedQuantity * presentation.factor;

      // Convertir el costo a costo por unidad base.
      const baseUnitCost =
        item.purchasedUnitCost / presentation.factor;

      const subtotal =
        item.purchasedQuantity * item.purchasedUnitCost;

      if (
        !Number.isFinite(baseQuantity) ||
        baseQuantity <= 0 ||
        !Number.isFinite(baseUnitCost) ||
        !Number.isFinite(subtotal)
      ) {
        throw new Error("INVALID_TOTAL");
      }

      const purchaseDate = item.purchaseDate
        ? new Date(item.purchaseDate)
        : new Date();

      preparedItems.push({
        sourceProduct,
        presentation,
        purchasedQuantity: item.purchasedQuantity,
        purchasedUnitCost: item.purchasedUnitCost,
        baseQuantity,
        baseUnitCost,
        subtotal,
        lotCode: item.lotCode?.trim() || null,
        purchaseDate,
      });
    }

    // ========================================================
    // 3. CALCULAR TOTAL DE LA COMPRA
    // ========================================================

    const calculatedTotal = preparedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );

    if (!Number.isFinite(calculatedTotal) || calculatedTotal < 0) {
      throw new Error("INVALID_TOTAL");
    }

    // ========================================================
    // 4. COMPROBAR DISPONIBILIDAD DE CAJA
    // ========================================================

    let cashBox = null;

    if (data.paymentType !== "CREDITO") {
      cashBox = await tx.cashBox.findFirst({
        where: {
          userId: data.userId,
          active: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      if (!cashBox) {
        throw new Error("CASHBOX_NOT_FOUND");
      }

      if (cashBox.currentBalance < calculatedTotal) {
        throw new Error("INSUFFICIENT_BALANCE");
      }
    }

    // ========================================================
    // 5. CREAR COMPRA
    // ========================================================

    const purchase = await tx.purchase.create({
      data: {
        total: calculatedTotal,
        paymentType: data.paymentType,
        supplierName: data.supplierName,
        notes: data.notes,
        userId: data.userId,
      },
    });

    // ========================================================
    // 6. PROCESAR CADA PRODUCTO Y CREAR SU LOTE
    // ========================================================

    for (const item of preparedItems) {
      // Consultar el producto actualizado.
      // Es importante si el mismo producto aparece varias veces
      // dentro de una misma compra.

      const currentProduct = await tx.product.findFirst({
        where: {
          id: item.sourceProduct.id,
          userId: data.userId,
        },
      });

      if (!currentProduct) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      // ------------------------------------------------------
      // 6.1. Calcular costo promedio ponderado
      // ------------------------------------------------------

      const currentStock = currentProduct.stock;
      const newStock = currentStock + item.baseQuantity;

      const newCostPrice =
        newStock > 0
          ? (
              currentStock * currentProduct.costPrice +
              item.baseQuantity * item.baseUnitCost
            ) / newStock
          : item.baseUnitCost;

      // ------------------------------------------------------
      // 6.2. Actualizar el producto maestro
      // ------------------------------------------------------

      await tx.product.update({
        where: {
          id: currentProduct.id,
        },
        data: {
          stock: {
            increment: item.baseQuantity,
          },
          costPrice: newCostPrice,
        },
      });

      // ------------------------------------------------------
      // 6.3. Crear el detalle de compra
      // ------------------------------------------------------

      const purchaseItem = await tx.purchaseItem.create({
        data: {
          quantity: item.baseQuantity,
          unitCost: item.baseUnitCost,
          subtotal: item.subtotal,

          purchasedQuantity: item.purchasedQuantity,
          purchasedUnitCost: item.purchasedUnitCost,

          presentationName: item.presentation.name,
          presentationFactor: item.presentation.factor,

          productName: currentProduct.name,
          productId: currentProduct.id,

          lotCode: item.lotCode,
          purchaseDate: item.purchaseDate,

          purchaseId: purchase.id,
        },
      });

      // ------------------------------------------------------
      // 6.4. CREAR UN LOTE NUEVO
      // ------------------------------------------------------
      // Nunca reutilizamos un lote anterior.
      // Cada PurchaseItem genera su propio ProductLot.

      const productLot = await tx.productLot.create({
        data: {
          lotCode: item.lotCode,
          purchaseDate: item.purchaseDate,

          initialQuantity: item.baseQuantity,
          availableQuantity: item.baseQuantity,

          unitCost: item.baseUnitCost,

          productId: currentProduct.id,
          purchaseItemId: purchaseItem.id,
        },
      });

      // ------------------------------------------------------
      // 6.5. Registrar movimiento de inventario
      // ------------------------------------------------------

      await tx.stockMovement.create({
        data: {
          type: "PURCHASE",
          quantity: item.baseQuantity,

          note: `Compra #${purchase.id}${
            item.lotCode ? ` — Lote ${item.lotCode}` : ""
          }`,

          productId: currentProduct.id,
          productLotId: productLot.id,

          userId: data.userId,
        },
      });
    }

    // ========================================================
    // 7. DESCONTAR DINERO DE LA CAJA
    // ========================================================

    if (cashBox) {
      await tx.cashBox.update({
        where: {
          id: cashBox.id,
        },
        data: {
          currentBalance: {
            decrement: calculatedTotal,
          },
        },
      });

      await tx.cashMovement.create({
        data: {
          type: "PURCHASE",
          amount: calculatedTotal,

          description: `Compra #${purchase.id}`,

          referenceType: "PURCHASE",
          referenceId: purchase.id,

          userId: data.userId,
          cashBoxId: cashBox.id,
        },
      });
    }

    // ========================================================
    // 8. REGISTRAR DEUDA SI LA COMPRA ES A CRÉDITO
    // ========================================================

    if (data.paymentType === "CREDITO") {
      await tx.debt.create({
        data: {
          personName: data.supplierName!.trim(),

          type: "SUPPLIER",

          total: calculatedTotal,
          remaining: calculatedTotal,

          status: "OPEN",

          notes: `Deuda generada por compra #${purchase.id}`,

          userId: data.userId,
          purchaseId: purchase.id,
        },
      });
    }

    return purchase;
  });
}

// ============================================================
// 9. CONSULTAR TODAS LAS COMPRAS
// ============================================================

export async function getPurchasesRepo(userId: number) {
  return prisma.purchase.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              barcode: true,
              unit: true,
            },
          },
          productLot: true,
        },
      },
    },
  });
}

// ============================================================
// 10. CONSULTAR UNA COMPRA POR ID
// ============================================================

export async function getPurchaseByIdRepo(id: number) {
  return prisma.purchase.findUnique({
    where: {
      id,
    },
    include: {
      items: {
        include: {
          product: true,
          productLot: true,
        },
      },
      user: true,
    },
  });
}
