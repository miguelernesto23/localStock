"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

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

export async function getDashboardData() {
  // 1. Verificar la sesión antes de consultar datos.
  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("No autorizado");
  }

  const userId = user.id;
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const month = getMonthRange();
  const range = getDateRange(30);

  // 2. Métricas principales: cada consulta pertenece al usuario.
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
        userId,
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
        userId,
        createdAt: {
          gte: month.start,
          lte: month.end,
        },
      },
    }),

    prisma.product.count({
      where: {
        userId,
        active: true,
      },
    }),

    prisma.product.count({
      where: {
        userId,
        active: true,
        stock: {
          gt: 0,
        },
      },
    }),

    prisma.product.count({
      where: {
        userId,
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
        userId,
        remaining: {
          gt: 0,
        },
      },
    }),

    prisma.cashBox.findMany({
      where: {
        userId,
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
        userId,
        createdAt: {
          gte: month.start,
          lte: month.end,
        },
      },
    }),
  ]);

  // 3. Valor del inventario propio.
  const productsForInventory = await prisma.product.findMany({
    where: {
      userId,
      active: true,
    },
    select: {
      stock: true,
      costPrice: true,
      minStock: true,
    },
  });

  const inventoryValue = productsForInventory.reduce(
    (total, product) => total + product.stock * (product.costPrice ?? 0),
    0,
  );

  const productsWithLowStock = productsForInventory.filter(
    (product) => product.stock > 0 && product.stock <= product.minStock,
  ).length;

  const totalCash = activeCashBoxes.reduce(
    (total, cashBox) => total + cashBox.currentBalance,
    0,
  );

  // 4. Ventas de los últimos 30 días del usuario.
  const salesLast30Days = await prisma.sale.findMany({
    where: {
      userId,
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

  // 5. Productos más vendidos: solo ventas propias.
  const topProducts = await prisma.saleItem.groupBy({
    by: ["productId"],
    _sum: {
      quantity: true,
      subtotal: true,
      profit: true,
    },
    where: {
      sale: {
        is: {
          userId,
          createdAt: {
            gte: month.start,
            lte: month.end,
          },
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

      // No recuperar productos pertenecientes a otra cuenta.
      const product = await prisma.product.findFirst({
        where: {
          id: item.productId,
          userId,
        },
        select: {
          name: true,
        },
      });

      // Si el producto no pertenece al usuario, no mostrarlo.
      if (!product) {
        return null;
      }

      return {
        name: product.name,
        cantidad: item._sum.quantity ?? 0,
        ventas: item._sum.subtotal ?? 0,
        utilidad: item._sum.profit ?? 0,
      };
    }),
  );

  const cleanTopProducts = topProductData.filter(
    (product): product is NonNullable<typeof product> => product !== null,
  );

  // 6. Métodos de pago propios.
  const paymentGroups = await prisma.sale.groupBy({
    by: ["paymentType"],
    _sum: {
      total: true,
    },
    _count: {
      id: true,
    },
    where: {
      userId,
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

  // 7. Comparación mensual de ventas y compras propias.
  const [monthlySales, monthlyPurchases] = await Promise.all([
    prisma.sale.aggregate({
      _sum: {
        total: true,
        profit: true,
      },
      where: {
        userId,
        createdAt: {
          gte: month.start,
          lte: month.end,
        },
      },
    }),

    prisma.purchase.aggregate({
      _sum: {
        total: true,
      },
      where: {
        userId,
        createdAt: {
          gte: month.start,
          lte: month.end,
        },
      },
    }),
  ]);

  // 8. Últimas ventas propias.
  const recentSales = await prisma.sale.findMany({
    where: {
      userId,
    },
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

  // 9. Últimas compras propias.
  const recentPurchases = await prisma.purchase.findMany({
    where: {
      userId,
    },
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

  // 10. Productos propios con stock bajo.
  const lowStockProducts = await prisma.product.findMany({
    where: {
      userId,
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

  // 11. Resultado con la misma estructura del dashboard.
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
