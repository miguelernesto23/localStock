import prisma from "@/lib/prisma";

export async function getCashBoxesRepo(userId: number) {
  return prisma.cashBox.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getActiveCashBoxRepo(userId: number) {
  return prisma.cashBox.findFirst({
    where: {
      userId,
      active: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

type CreateCashBoxInput = {
  name: string;
  initialCapital: number;
  userId: number;
};

export async function createCashBoxRepo(data: CreateCashBoxInput) {
  return prisma.$transaction(async (tx) => {
    const cashBox = await tx.cashBox.create({
      data: {
        name: data.name,
        initialCapital: data.initialCapital,
        currentBalance: data.initialCapital,
        currency: "CUP",
        userId: data.userId,
      },
    });

    if (data.initialCapital > 0) {
      await tx.cashMovement.create({
        data: {
          type: "ADJUSTMENT",
          amount: data.initialCapital,
          description: "Capital inicial",
          userId: data.userId,
          cashBoxId: cashBox.id,
        },
      });
    }

    return cashBox;
  });
}
export async function getCashMovementsRepo(cashBoxId: number, userId: number) {
  return prisma.cashMovement.findMany({
    where: {
      cashBoxId,
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
type AddCapitalInput = {
  cashBoxId: number;
  amount: number;
  userId: number;
};

export async function addCapitalRepo(data: AddCapitalInput) {
  return prisma.$transaction(async (tx) => {
    const cashBox = await tx.cashBox.findFirst({
      where: {
        id: data.cashBoxId,
        userId: data.userId,
        active: true,
      },
    });

    if (!cashBox) {
      throw new Error("CASHBOX_NOT_FOUND");
    }

    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      throw new Error("INVALID_AMOUNT");
    }

    const updatedCashBox = await tx.cashBox.update({
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
        type: "ADJUSTMENT",
        amount: data.amount,
        description: "Ingreso de capital",
        userId: data.userId,
        cashBoxId: cashBox.id,
      },
    });

    return updatedCashBox;
  });
}
