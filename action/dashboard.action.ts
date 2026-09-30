"use server";

import prisma from "@/lib/prisma";

function getDateRange(days: number) {
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function getMonthRange() {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  return { start, end };
}

function formatDay(date: Date) {
  return date.toLocaleDateString("es-CU", {
    day: "2-digit",
    month: "2-digit",
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("es-CU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function getDashboardData() {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const month = getMonthRange();
  const range = getDateRange(30);

  /*
   * ============================================================
   * MÉTRICAS PRINCIPALES
   * ============================================================
   */

  const [
    todaySales,
    monthSales,
    productsCount,
    lowStockCount,
    outOfStockCount,
    pendingDebts,
    activeCashBoxes,
    monthPurchases,
  ] = await Promise.all([
    prisma.sale.aggregate({
      _sum: {
        total: true,
        profit: true,
      },
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    }),

    prisma.sale.aggregate({
      _sum: {
        total: true,
        profit: true,
      },
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: month.start,
          lte: month.end,
        },
      },
    }),

    prisma.product.count({
      where: {
        active: true,
      },
    }),

    prisma.product.count({
      where: {
        active: true,
        stock: {
          gt: 0,
        },
      },
    }),

    prisma.product.count({
      where: {
        active: true,
        stock: 0,
      },
    }),

    prisma.debt.aggregate({
      _sum: {
        remaining: true,
      },
      _count: {
        id: true,
      },
      where: {
        remaining: {
          gt: 0,
        },
      },
    }),

    prisma.cashBox.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
        currentBalance: true,
        currency: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.purchase.aggregate({
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
      where: {
        createdAt: {
          gte: month.start,
          lte: month.end,
        },
      },
    }),
  ]);

  /*
   * ============================================================
   * VALOR DEL INVENTARIO
   * ============================================================
   */

  const productsForInventory = await prisma.product.findMany({
    where: {
      active: true,
    },
    select: {
      stock: true,
      costPrice: true,
      minStock: true,
    },
  });

  const inventoryValue = productsForInventory.reduce((total, product) => {
    return total + product.stock * (product.costPrice ?? 0);
  }, 0);

  const productsWithLowStock = productsForInventory.filter(
    (product) => product.stock > 0 && product.stock <= product.minStock,
  ).length;

  const totalCash = activeCashBoxes.reduce(
    (total, cashBox) => total + cashBox.currentBalance,
    0,
  );

  /*
   * ============================================================
   * VENTAS ÚLTIMOS 30 DÍAS
   * ============================================================
   */

  const salesLast30Days = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: range.start,
        lte: range.end,
      },
    },
    select: {
      total: true,
      profit: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const salesByDay = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(range.start);
    date.setDate(range.start.getDate() + i);

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const daySales = salesLast30Days.filter(
      (sale) => sale.createdAt >= dayStart && sale.createdAt <= dayEnd,
    );

    salesByDay.push({
      date: formatDay(date),
      ventas: daySales.reduce((sum, sale) => sum + sale.total, 0),
      utilidad: daySales.reduce((sum, sale) => sum + sale.profit, 0),
      cantidad: daySales.length,
    });
  }

  /*
   * ============================================================
   * PRODUCTOS MÁS VENDIDOS
   * ============================================================
   */

  const topProducts = await prisma.saleItem.groupBy({
    by: ["productId"],
    _sum: {
      quantity: true,
      subtotal: true,
      profit: true,
    },
    where: {
      sale: {
        createdAt: {
          gte: month.start,
          lte: month.end,
        },
      },
      productId: {
        not: null,
      },
    },
    orderBy: {
      _sum: {
        quantity: "desc",
      },
    },
    take: 10,
  });

  const topProductData = await Promise.all(
    topProducts.map(async (item) => {
      if (!item.productId) {
        return null;
      }

      const product = await prisma.product.findUnique({
        where: {
          id: item.productId,
        },
        select: {
          name: true,
        },
      });

      return {
        name: product?.name ?? "Producto eliminado",
        cantidad: item._sum.quantity ?? 0,
        ventas: item._sum.subtotal ?? 0,
        utilidad: item._sum.profit ?? 0,
      };
    }),
  );

  const cleanTopProducts = topProductData.filter(
    (product): product is NonNullable<typeof product> => product !== null,
  );

  /*
   * ============================================================
   * MÉTODOS DE PAGO
   * ============================================================
   */

  const paymentGroups = await prisma.sale.groupBy({
    by: ["paymentType"],
    _sum: {
      total: true,
    },
    _count: {
      id: true,
    },
    where: {
      createdAt: {
        gte: month.start,
        lte: month.end,
      },
    },
  });

  const paymentMethods = paymentGroups.map((payment) => ({
    name: payment.paymentType ?? "Sin especificar",
    total: payment._sum.total ?? 0,
    cantidad: payment._count.id,
  }));

  /*
   * ============================================================
   * COMPRAS VS VENTAS
   * ============================================================
   */

  const monthlySales = await prisma.sale.aggregate({
    _sum: {
      total: true,
      profit: true,
    },
    where: {
      createdAt: {
        gte: month.start,
        lte: month.end,
      },
    },
  });

  const monthlyPurchases = await prisma.purchase.aggregate({
    _sum: {
      total: true,
    },
    where: {
      createdAt: {
        gte: month.start,
        lte: month.end,
      },
    },
  });

  /*
   * ============================================================
   * ÚLTIMAS VENTAS
   * ============================================================
   */

  const recentSales = await prisma.sale.findMany({
    take: 8,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      total: true,
      profit: true,
      paymentType: true,
      createdAt: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  /*
   * ============================================================
   * ÚLTIMAS COMPRAS
   * ============================================================
   */

  const recentPurchases = await prisma.purchase.findMany({
    take: 8,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      total: true,
      supplierName: true,
      paymentType: true,
      createdAt: true,
    },
  });

  /*
   * ============================================================
   * PRODUCTOS CON STOCK BAJO
   * ============================================================
   */

  const lowStockProducts = await prisma.product.findMany({
    where: {
      active: true,
      stock: {
        lte: prisma.product.fields.minStock,
      },
    },
    select: {
      id: true,
      name: true,
      stock: true,
      minStock: true,
      unit: true,
    },
    orderBy: {
      stock: "asc",
    },
    take: 10,
  });

  /*
   * ============================================================
   * RESULTADO
   * ============================================================
   */

  return {
    period: {
      start: range.start.toISOString(),
      end: range.end.toISOString(),
      monthStart: month.start.toISOString(),
      monthEnd: month.end.toISOString(),
    },

    metrics: {
      todaySales: todaySales._sum.total ?? 0,
      todayProfit: todaySales._sum.profit ?? 0,
      todaySalesCount: todaySales._count.id,

      monthSales: monthSales._sum.total ?? 0,
      monthProfit: monthSales._sum.profit ?? 0,
      monthSalesCount: monthSales._count.id,

      productsCount,

      lowStockCount: productsWithLowStock,

      outOfStockCount,

      pendingDebtAmount: pendingDebts._sum.remaining ?? 0,
      pendingDebtCount: pendingDebts._count.id,

      inventoryValue,

      totalCash,

      monthPurchases: monthPurchases._sum.total ?? 0,
      monthPurchasesCount: monthPurchases._count.id,
    },

    charts: {
      salesByDay,

      topProducts: cleanTopProducts,

      paymentMethods,

      salesVsPurchases: [
        {
          name: "Este mes",
          ventas: monthlySales._sum.total ?? 0,
          compras: monthlyPurchases._sum.total ?? 0,
          utilidad: monthlySales._sum.profit ?? 0,
        },
      ],
    },

    cashBoxes: activeCashBoxes,

    recentSales: recentSales.map((sale) => ({
      id: sale.id,
      total: sale.total,
      profit: sale.profit,
      paymentType: sale.paymentType ?? "Sin especificar",
      createdAt: sale.createdAt.toISOString(),
      userName: sale.user.name,
    })),

    recentPurchases: recentPurchases.map((purchase) => ({
      id: purchase.id,
      total: purchase.total,
      supplierName: purchase.supplierName ?? "Sin proveedor",
      paymentType: purchase.paymentType ?? "Sin especificar",
      createdAt: purchase.createdAt.toISOString(),
    })),

    lowStockProducts,

    generatedAt: now.toISOString(),
  };
}
