"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

// ----------------------------------------------------------
// RANGOS DE FECHAS
// ----------------------------------------------------------

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

// ----------------------------------------------------------
// FORMATEAR FECHAS
// ----------------------------------------------------------

function formatDay(date: Date) {
  return date.toLocaleDateString("es-CU", {
    day: "2-digit",
    month: "2-digit",
  });
}

// ----------------------------------------------------------
// DASHBOARD
// ----------------------------------------------------------

export async function getDashboardData() {
  // 1. Verificar autenticación.

  const user = await getCurrentUser();

  if (!user?.id) {
    throw new Error("No autorizado");
  }

  const userId = user.id;
  const now = new Date();

  // 2. Preparar rangos de fechas.

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const month = getMonthRange();
  const range = getDateRange(30);

  // --------------------------------------------------------
  // 3. MÉTRICAS PRINCIPALES
  // --------------------------------------------------------

  const [
    todaySales,
    monthSales,
    pendingDebts,
    activeCashBoxes,
    monthPurchases,
    productsForInventory,
  ] = await Promise.all([
    // Ventas de hoy.

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

    // Ventas del mes.

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

    // Deudas pendientes.

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

    // Cajas activas.

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

    // Compras del mes.

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

    // Productos activos con sus lotes disponibles.

    prisma.product.findMany({
      where: {
        userId,
        active: true,
      },
      select: {
        id: true,
        name: true,
        stock: true,
        costPrice: true,
        minStock: true,
        unit: true,
        lots: {
          where: {
            availableQuantity: {
              gt: 0,
            },
          },
          select: {
            availableQuantity: true,
            unitCost: true,
          },
        },
      },
    }),
  ]);

  // --------------------------------------------------------
  // 4. MÉTRICAS DE INVENTARIO
  // --------------------------------------------------------

  const productsCount = productsForInventory.length;

  const outOfStockCount = productsForInventory.filter(
    (product) => product.stock <= 0,
  ).length;

  const lowStockProducts = productsForInventory
    .filter((product) => product.stock > 0 && product.stock <= product.minStock)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 10);

  const productsWithLowStock = productsForInventory.filter(
    (product) => product.stock > 0 && product.stock <= product.minStock,
  ).length;

  // Valor del inventario:
  // 1. Existencias con lote: cantidad disponible × costo del lote.
  // 2. Existencias sin lote: cantidad restante × costo general.

  const inventoryValue = productsForInventory.reduce((total, product) => {
    const lotStock = product.lots.reduce(
      (sum, lot) => sum + lot.availableQuantity,
      0,
    );

    const lotValue = product.lots.reduce(
      (sum, lot) => sum + lot.availableQuantity * lot.unitCost,
      0,
    );

    // Inventario antiguo que todavía no tiene lotes asociados.

    const unassignedStock = Math.max(product.stock - lotStock, 0);

    const unassignedValue = unassignedStock * product.costPrice;

    return total + lotValue + unassignedValue;
  }, 0);

  // --------------------------------------------------------
  // 5. SALDO TOTAL DE CAJA
  // --------------------------------------------------------

  const totalCash = activeCashBoxes.reduce(
    (total, cashBox) => total + cashBox.currentBalance,
    0,
  );

  // --------------------------------------------------------
  // 6. VENTAS DE LOS ÚLTIMOS 30 DÍAS
  // --------------------------------------------------------

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

  // --------------------------------------------------------
  // 7. PRODUCTOS MÁS VENDIDOS
  // --------------------------------------------------------

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

  // Recuperar todos los nombres en una sola consulta.

  const topProductIds = topProducts.flatMap((item) =>
    item.productId === null ? [] : [item.productId],
  );

  const topProductRecords =
    topProductIds.length > 0
      ? await prisma.product.findMany({
          where: {
            id: {
              in: topProductIds,
            },
            userId,
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

  const productNames = new Map(
    topProductRecords.map((product) => [product.id, product.name]),
  );

  const cleanTopProducts = topProducts.flatMap((item) => {
    if (item.productId === null) {
      return [];
    }

    const name = productNames.get(item.productId);

    if (!name) {
      return [];
    }

    return [
      {
        name,
        cantidad: item._sum.quantity ?? 0,
        ventas: item._sum.subtotal ?? 0,
        utilidad: item._sum.profit ?? 0,
      },
    ];
  });

  // --------------------------------------------------------
  // 8. MÉTODOS DE PAGO
  // --------------------------------------------------------

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

  // --------------------------------------------------------
  // 9. COMPARACIÓN DE VENTAS Y COMPRAS
  // --------------------------------------------------------

  // Reutilizamos los agregados mensuales anteriores.
  // No necesitamos consultar nuevamente la base de datos.

  const salesVsPurchases = [
    {
      name: "Este mes",
      ventas: monthSales._sum.total ?? 0,
      compras: monthPurchases._sum.total ?? 0,
      utilidad: monthSales._sum.profit ?? 0,
    },
  ];

  // --------------------------------------------------------
  // 10. ÚLTIMAS VENTAS
  // --------------------------------------------------------

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

  // --------------------------------------------------------
  // 11. ÚLTIMAS COMPRAS
  // --------------------------------------------------------

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

  // --------------------------------------------------------
  // 12. RESPUESTA DEL DASHBOARD
  // --------------------------------------------------------

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
      salesVsPurchases,
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
