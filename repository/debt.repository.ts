import prisma from "@/lib/prisma";

type PayDebtInput = {
  debtId: number;
  amount: number;
  notes?: string;
  userId: number;
};

export async function getDebtsRepo(userId: number) {
  return prisma.debt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      purchase: {
        select: {
          id: true,
          total: true,
          paymentType: true,
          supplierName: true,
          createdAt: true,
        },
      },
      ticket: {
        select: {
          id: true,
          number: true,
          total: true,
          createdAt: true,
        },
      },
      payments: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          amount: true,
          notes: true,
          createdAt: true,
          cashBox: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function getDebtByIdRepo(
  id: number,
  userId: number
) {
  return prisma.debt.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      purchase: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      ticket: true,
      payments: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          cashBox: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });
}

export async function payDebtRepo(data: PayDebtInput) {
  return prisma.$transaction(async (tx) => {
    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error("INVALID_AMOUNT");
    }

    const debt = await tx.debt.findFirst({
      where: {
        id: data.debtId,
        userId: data.userId,
      },
    });

    if (!debt) {
      throw new Error("DEBT_NOT_FOUND");
    }

    if (debt.status === "PAID" || debt.remaining <= 0) {
      throw new Error("DEBT_ALREADY_PAID");
    }

    if (data.amount > debt.remaining) {
      throw new Error("AMOUNT_EXCEEDS_DEBT");
    }

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

    // Cuando nosotros pagamos al proveedor,
    // el dinero sale de la caja.
    if (debt.type === "SUPPLIER") {
      if (cashBox.currentBalance < data.amount) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      await tx.cashBox.update({
        where: {
          id: cashBox.id,
        },
        data: {
          currentBalance: {
            decrement: data.amount,
          },
        },
      });

      await tx.cashMovement.create({
        data: {
          type: "DEBT_PAYMENT",
          amount: data.amount,
          description: `Pago de deuda #${debt.id}`,
          referenceType: "DEBT",
          referenceId: debt.id,
          userId: data.userId,
          cashBoxId: cashBox.id,
        },
      });
    }

    // Cuando un cliente nos paga,
    // el dinero entra a la caja.
    if (debt.type === "CLIENT") {
      await tx.cashBox.update({
        where: {
          id: cashBox.id,
        },
        data: {
          currentBalance: {
            increment: data.amount,
          },
        },
      });

      await tx.cashMovement.create({
        data: {
          type: "DEBT_COLLECTION",
          amount: data.amount,
          description: `Cobro de deuda #${debt.id}`,
          referenceType: "DEBT",
          referenceId: debt.id,
          userId: data.userId,
          cashBoxId: cashBox.id,
        },
      });
    }

    const newRemaining =
      Math.max(0, debt.remaining - data.amount);

    const newStatus =
      newRemaining === 0
        ? "PAID"
        : "PARTIAL";

    const updatedDebt = await tx.debt.update({
      where: {
        id: debt.id,
      },
      data: {
        remaining: newRemaining,
        status: newStatus,
      },
    });

    const payment = await tx.debtPayment.create({
      data: {
        amount: data.amount,
        notes: data.notes?.trim() || undefined,
        debtId: debt.id,
        userId: data.userId,
        cashBoxId: cashBox.id,
      },
    });

    return {
      debt: updatedDebt,
      payment,
    };
  });
}