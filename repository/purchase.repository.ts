import prisma from "@/lib/prisma";

type PurchaseItemInput = {
  productId: number;
  quantity: number;
  unitCost: number;
  lotCode?: string;
  purchaseDate?: string;
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
    if (data.items.length === 0) {
      throw new Error("EMPTY_PURCHASE");
    }

    for (const item of data.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error("INVALID_QUANTITY");
      }

      if (!Number.isFinite(item.unitCost) || item.unitCost < 0) {
        throw new Error("INVALID_UNIT_COST");
      }

      if (item.lotCode !== undefined && !item.lotCode.trim()) {
        throw new Error("INVALID_LOT_CODE");
      }

      if (
        item.purchaseDate !== undefined &&
        Number.isNaN(Date.parse(item.purchaseDate))
      ) {
        throw new Error("INVALID_PURCHASE_DATE");
      }
    }

    const calculatedTotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );

    if (!Number.isFinite(calculatedTotal) || calculatedTotal < 0) {
      throw new Error("INVALID_TOTAL");
    }

    if (data.paymentType === "CREDITO" && !data.supplierName?.trim()) {
      throw new Error("SUPPLIER_REQUIRED");
    }

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

    const purchase = await tx.purchase.create({
      data: {
        total: calculatedTotal,
        paymentType: data.paymentType,
        supplierName: data.supplierName,
        notes: data.notes,
        userId: data.userId,
      },
    });

    for (const item of data.items) {
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

      const purchaseDate = item.purchaseDate
        ? new Date(item.purchaseDate)
        : new Date();

      const lotCode =
        item.lotCode?.trim() || `LOTE-${purchase.id}-${sourceProduct.id}`;

      // Cada compra crea un producto independiente que representa el lote.
      const lot = await tx.product.create({
        data: {
          name: sourceProduct.name,
          barcode: null,
          description: sourceProduct.description,
          unit: sourceProduct.unit,
          price: sourceProduct.price,
          costPrice: item.unitCost,
          stock: item.quantity,
          minStock: sourceProduct.minStock,
          active: true,
          categoryId: sourceProduct.categoryId,
          userId: data.userId,
          lotCode,
          purchaseDate,
        },
      });

      const subtotal = item.quantity * item.unitCost;

      await tx.purchaseItem.create({
        data: {
          quantity: item.quantity,
          unitCost: item.unitCost,
          subtotal,
          productName: lot.name,
          purchaseId: purchase.id,
          productId: lot.id,
        },
      });

      await tx.stockMovement.create({
        data: {
          type: "PURCHASE",
          quantity: item.quantity,
          note: `Compra #${purchase.id} — Lote ${lotCode}`,
          productId: lot.id,
          userId: data.userId,
        },
      });
    }

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
        },
      },
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
