import prisma from "@/lib/prisma";

type LotAllocationInput = {
  lotId: number;
  quantity: number;
};

type SaleItemInput = {
  productId: number;
  quantity: number;
  unitPrice: number;

  // Si se proporciona, se utilizan estos lotes.
  // Si se omite, se aplica FIFO automáticamente.
  lotAllocations?: LotAllocationInput[];
};

type CreateSaleInput = {
  paymentType: "EFECTIVO" | "TRANSFERENCIA" | "CREDITO";
  userId: number;
  items: SaleItemInput[];
};

// ============================================================
// CREAR VENTA CON LOTES MANUALES O FIFO
// ============================================================

export async function createSaleRepo(data: CreateSaleInput) {
  return prisma.$transaction(async (tx) => {
    if (data.items.length === 0) {
      throw new Error("EMPTY_SALE");
    }

    // --------------------------------------------------------
    // 1. Validar productos y cantidades
    // --------------------------------------------------------

    const products = [];

    for (const item of data.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new Error("INVALID_QUANTITY");
      }

      if (!Number.isFinite(item.unitPrice) || item.unitPrice <= 0) {
        throw new Error("INVALID_PRICE");
      }

      const product = await tx.product.findFirst({
        where: {
          id: item.productId,
          userId: data.userId,
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

      products.push({
        item,
        product,
      });
    }

    // --------------------------------------------------------
    // 2. Comprobar caja
    // --------------------------------------------------------

    let cashBox = null;

    if (
      data.paymentType === "EFECTIVO" ||
      data.paymentType === "TRANSFERENCIA"
    ) {
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
    }

    // --------------------------------------------------------
    // 3. Crear venta provisional
    // --------------------------------------------------------

    const sale = await tx.sale.create({
      data: {
        total: 0,
        profit: 0,
        paymentType: data.paymentType,
        userId: data.userId,
      },
    });

    let total = 0;
    let totalProfit = 0;

    // --------------------------------------------------------
    // 4. Procesar cada producto
    // --------------------------------------------------------

    for (const { item, product } of products) {
      const allocations: {
        lot: {
          id: number;
          lotCode: string | null;
          availableQuantity: number;
          unitCost: number;
        };
        quantity: number;
      }[] = [];

      // Consultar los lotes disponibles del producto.
      const lots = await tx.productLot.findMany({
        where: {
          productId: product.id,
          availableQuantity: {
            gt: 0,
          },
        },
        orderBy: [{ purchaseDate: "asc" }, { id: "asc" }],
      });

      // ------------------------------------------------------
      // 4.1. Selección manual de lotes
      // ------------------------------------------------------

      if (item.lotAllocations !== undefined) {
        if (item.lotAllocations.length === 0) {
          throw new Error("INVALID_LOT_ALLOCATION");
        }

        const selectedLotIds = new Set(
          item.lotAllocations.map((allocation) => allocation.lotId),
        );

        // No permitir repetir un mismo lote en el mismo artículo.
        if (selectedLotIds.size !== item.lotAllocations.length) {
          throw new Error("DUPLICATE_LOT_ALLOCATION");
        }

        // Comprobar que las cantidades seleccionadas sean válidas.
        for (const allocation of item.lotAllocations) {
          if (
            !Number.isInteger(allocation.lotId) ||
            allocation.lotId <= 0 ||
            !Number.isInteger(allocation.quantity) ||
            allocation.quantity <= 0
          ) {
            throw new Error("INVALID_LOT_ALLOCATION");
          }
        }

        // La suma de los lotes debe coincidir con la cantidad vendida.
        const selectedQuantity = item.lotAllocations.reduce(
          (sum, allocation) => sum + allocation.quantity,
          0,
        );

        if (selectedQuantity !== item.quantity) {
          throw new Error("LOT_QUANTITY_MISMATCH");
        }

        // Comprobar que los lotes pertenecen al producto.
        const selectedLots = await tx.productLot.findMany({
          where: {
            id: {
              in: [...selectedLotIds],
            },
            productId: product.id,
          },
        });

        if (selectedLots.length !== item.lotAllocations.length) {
          throw new Error("LOT_NOT_FOUND");
        }

        const lotsById = new Map(selectedLots.map((lot) => [lot.id, lot]));

        for (const allocation of item.lotAllocations) {
          const lot = lotsById.get(allocation.lotId);

          if (!lot) {
            throw new Error("LOT_NOT_FOUND");
          }

          if (lot.availableQuantity < allocation.quantity) {
            throw new Error(`INSUFFICIENT_LOT_STOCK:${product.name}`);
          }

          allocations.push({
            lot,
            quantity: allocation.quantity,
          });
        }
      } else {
        // ----------------------------------------------------
        // 4.2. FIFO automático si no se seleccionaron lotes
        // ----------------------------------------------------

        let remainingQuantity = item.quantity;

        for (const lot of lots) {
          if (remainingQuantity <= 0) {
            break;
          }

          const quantityToTake = Math.min(
            remainingQuantity,
            lot.availableQuantity,
          );

          allocations.push({
            lot,
            quantity: quantityToTake,
          });

          remainingQuantity -= quantityToTake;
        }

        if (remainingQuantity > 0) {
          throw new Error(`INSUFFICIENT_LOT_STOCK:${product.name}`);
        }
      }

      // ------------------------------------------------------
      // 4.3. Calcular costo real y ganancia
      // ------------------------------------------------------

      let totalCost = 0;

      for (const allocation of allocations) {
        totalCost += allocation.quantity * allocation.lot.unitCost;
      }

      const subtotal = item.quantity * item.unitPrice;
      const averageCost = totalCost / item.quantity;
      const itemProfit = subtotal - totalCost;

      total += subtotal;
      totalProfit += itemProfit;

      // ------------------------------------------------------
      // 4.4. Crear detalle de venta
      // ------------------------------------------------------

      const saleItem = await tx.saleItem.create({
        data: {
          quantity: item.quantity,
          price: item.unitPrice,
          unitPrice: item.unitPrice,
          costPrice: averageCost,
          profit: itemProfit,
          subtotal,
          productName: product.name,
          saleId: sale.id,
          productId: product.id,
        },
      });

      // ------------------------------------------------------
      // 4.5. Descontar lotes y registrar trazabilidad
      // ------------------------------------------------------

      for (const allocation of allocations) {
        const { lot, quantity } = allocation;

        // Actualización condicional para evitar descontar
        // unidades que ya no estén disponibles.
        const updatedLot = await tx.productLot.updateMany({
          where: {
            id: lot.id,
            productId: product.id,
            availableQuantity: {
              gte: quantity,
            },
          },
          data: {
            availableQuantity: {
              decrement: quantity,
            },
          },
        });

        if (updatedLot.count !== 1) {
          throw new Error(`INSUFFICIENT_LOT_STOCK:${product.name}`);
        }

        // Guardar qué lote se utilizó y cuántas unidades.
        await tx.saleItemLot.create({
          data: {
            quantity,
            saleItemId: saleItem.id,
            productLotId: lot.id,
          },
        });

        // Registrar movimiento de inventario.
        await tx.stockMovement.create({
          data: {
            type: "SALE",
            quantity,
            note: `Venta #${sale.id} — Lote ${lot.lotCode || lot.id}`,
            productId: product.id,
            productLotId: lot.id,
            userId: data.userId,
          },
        });
      }

      // ------------------------------------------------------
      // 4.6. Actualizar stock general del producto
      // ------------------------------------------------------

      const updatedProduct = await tx.product.updateMany({
        where: {
          id: product.id,
          userId: data.userId,
          stock: {
            gte: item.quantity,
          },
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });

      if (updatedProduct.count !== 1) {
        throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
      }
    }

    // --------------------------------------------------------
    // 5. Actualizar totales de la venta
    // --------------------------------------------------------

    const updatedSale = await tx.sale.update({
      where: {
        id: sale.id,
      },
      data: {
        total,
        profit: totalProfit,
      },
    });

    // --------------------------------------------------------
    // 6. Registrar deuda si es una venta a crédito
    // --------------------------------------------------------

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
        },
      });
    }

    // --------------------------------------------------------
    // 7. Registrar ingreso en caja
    // --------------------------------------------------------

    if (cashBox) {
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

    return updatedSale;
  });
}

// ============================================================
// OBTENER TODAS LAS VENTAS
// ============================================================

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
        include: {
          product: true,
          lotAllocations: {
            include: {
              productLot: true,
            },
          },
        },
      },
    },
  });
}

// ============================================================
// OBTENER UNA VENTA POR ID
// ============================================================

export async function getSaleByIdRepo(id: number, userId: number) {
  return prisma.sale.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      items: {
        include: {
          product: true,
          lotAllocations: {
            include: {
              productLot: true,
            },
          },
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
