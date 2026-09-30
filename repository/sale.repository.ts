import prisma from "@/lib/prisma";

type SaleItemInput = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

type CreateSaleInput = {
  paymentType: "EFECTIVO" | "TRANSFERENCIA" | "CREDITO";
  userId: number;
  items: SaleItemInput[];
};

// Crear la venta
export async function createSaleRepo(data: CreateSaleInput) {
  return prisma.$transaction(async (tx) => {
    // -----------------------------------------
    // 1. Validar que existan productos
    // -----------------------------------------

    if (data.items.length === 0) {
      throw new Error("EMPTY_SALE");
    }

    let total = 0;
    let profit = 0;

    // Guardamos los productos encontrados
    const products = [];

    // -----------------------------------------
    // 2. Verificar productos y stock
    // -----------------------------------------

    for (const item of data.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error("INVALID_QUANTITY");
      }

      if (!Number.isFinite(item.unitPrice) || item.unitPrice <= 0) {
        throw new Error("INVALID_PRICE");
      }

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

      if (product.stock < item.quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
      }

      const subtotal = item.quantity * item.unitPrice;

      const itemProfit = (item.unitPrice - product.costPrice) * item.quantity;

      total += subtotal;
      profit += itemProfit;

      products.push({
        item,
        product,
        subtotal,
        itemProfit,
      });
    }

    // -----------------------------------------
    // 3. Crear la venta
    // -----------------------------------------

    const sale = await tx.sale.create({
      data: {
        total,
        profit,
        paymentType: data.paymentType,
        userId: data.userId,
      },
    });

    // -----------------------------------------
    // 4. Crear SaleItems + descontar stock
    // -----------------------------------------

    for (const { item, product, subtotal, itemProfit } of products) {
      await tx.saleItem.create({
        data: {
          quantity: item.quantity,

          // Precio utilizado realmente en esta venta
          price: item.unitPrice,
          unitPrice: item.unitPrice,

          // Costo del producto en el momento de la venta
          costPrice: product.costPrice,

          profit: itemProfit,
          subtotal,

          // Snapshot del nombre
          productName: product.name,

          saleId: sale.id,
          productId: product.id,
        },
      });

      // Descontar stock
      await tx.product.update({
        where: {
          id: product.id,
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      // Registrar movimiento de inventario
      await tx.stockMovement.create({
        data: {
          type: "SALE",
          quantity: item.quantity,
          note: `Venta #${sale.id}`,
          productId: product.id,
          userId: data.userId,
        },
      });
    }

    // -----------------------------------------
    // 5. Venta a crédito
    // -----------------------------------------

    if (data.paymentType === "CREDITO") {
      await tx.debt.create({
        data: {
          personName: "Cliente",
          type: "CLIENT",
          total,
          remaining: total,
          status: "OPEN",
          notes: `Deuda generada por venta #${sale.id}`,
          userId: data.userId,

          // Por ahora no tenemos ticket.
          // La venta queda identificada mediante las notas.
        },
      });
    }

    // -----------------------------------------
    // 6. Venta pagada inmediatamente
    // -----------------------------------------

    if (
      data.paymentType === "EFECTIVO" ||
      data.paymentType === "TRANSFERENCIA"
    ) {
      const cashBox = await tx.cashBox.findFirst({
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

      await tx.cashBox.update({
        where: {
          id: cashBox.id,
        },
        data: {
          currentBalance: {
            increment: total,
          },
        },
      });

      await tx.cashMovement.create({
        data: {
          type: "SALE",
          amount: total,
          description: `Venta #${sale.id}`,
          referenceType: "SALE",
          referenceId: sale.id,
          userId: data.userId,
          cashBoxId: cashBox.id,
        },
      });
    }

    return sale;
  });
}
// Obtener todas las ventas
export async function getSalesRepo(userId: number) {
  return prisma.sale.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          subtotal: true,
          productName: true,
          productId: true,
        },
      },
    },
  });
}

export async function getSaleByIdRepo(
  id: number,
  userId: number
) {
  return prisma.sale.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          user_name: true,
        },
      },
    },
  });
}