import prisma from "@/lib/prisma";

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
  userId: number;
  items: PurchaseItemInput[];
};

export async function createPurchaseRepo(data: CreatePurchaseInput) {
  return prisma.$transaction(async (tx) => {
    // ==============================
    // 1. Validaciones generales
    // ==============================

    if (data.items.length === 0) {
      throw new Error("EMPTY_PURCHASE");
    }

    // Calcular total real en el servidor
    const calculatedTotal = data.items.reduce((sum, item) => {
      return sum + item.quantity * item.unitCost;
    }, 0);

    if (!Number.isFinite(calculatedTotal) || calculatedTotal < 0) {
      throw new Error("INVALID_TOTAL");
    }

    // ==============================
    // 2. Validar compra a crédito
    // ==============================

    if (data.paymentType === "CREDITO" && !data.supplierName?.trim()) {
      throw new Error("SUPPLIER_REQUIRED");
    }

    // ==============================
    // 3. Buscar caja si NO es crédito
    // ==============================

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

    // ==============================
    // 4. Crear compra
    // ==============================

    const purchase = await tx.purchase.create({
      data: {
        total: calculatedTotal,
        paymentType: data.paymentType,
        supplierName: data.supplierName,
        notes: data.notes,
        userId: data.userId,
      },
    });

    // ==============================
    // 5. Procesar productos
    // ==============================

    for (const item of data.items) {
      // Validar cantidad
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error("INVALID_QUANTITY");
      }

      // Validar costo
      if (!Number.isFinite(item.unitCost) || item.unitCost < 0) {
        throw new Error("INVALID_UNIT_COST");
      }

      // Buscar producto
      const product = await tx.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      if (!product.active) {
        throw new Error("PRODUCT_INACTIVE");
      }

      const subtotal = item.quantity * item.unitCost;

      // ==============================
      // Detalle de compra
      // ==============================

      await tx.purchaseItem.create({
        data: {
          quantity: item.quantity,
          unitCost: item.unitCost,
          subtotal,
          productName: product.name,
          purchaseId: purchase.id,
          productId: product.id,
        },
      });

      // ==============================
      // Actualizar producto
      // ==============================

      await tx.product.update({
        where: {
          id: product.id,
        },
        data: {
          stock: {
            increment: item.quantity,
          },
          costPrice: item.unitCost,
        },
      });

      // ==============================
      // Movimiento de inventario
      // ==============================

      await tx.stockMovement.create({
        data: {
          type: "PURCHASE",
          quantity: item.quantity,
          note: `Compra #${purchase.id}`,
          productId: product.id,
          userId: data.userId,
        },
      });
    }

    // ==============================
    // 6. Actualizar capital
    // ==============================

    if (cashBox) {
      // Restar dinero de la caja
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

      // Registrar movimiento de caja
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

    // ==============================
    // 7. Compra a crédito
    // ==============================

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

    // ==============================
    // 8. Retornar compra
    // ==============================

    return purchase;
  });
}

export async function getPurchasesRepo() {
  return prisma.purchase.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: true,
    },
  });
}

export async function getPurchaseByIdRepo(id: number) {
  return prisma.purchase.findUnique({
    where: {
      id,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: true,
    },
  });
}
