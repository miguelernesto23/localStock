"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import {
  getDebtsRepo,
  getDebtByIdRepo,
  payDebtRepo,
} from "@/repository/debt.repository";

export async function getDebts() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    const debts = await getDebtsRepo(user.id);

    return {
      success: true as const,
      debts,
    };
  } catch (error) {
    console.error("Error obteniendo deudas:", error);

    return {
      success: false as const,
      error: "No se pudieron cargar las deudas.",
    };
  }
}

export async function getDebtById(id: number) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    if (!Number.isInteger(id) || id <= 0) {
      return {
        success: false as const,
        error: "La deuda no es válida.",
      };
    }

    const debt = await getDebtByIdRepo(id, user.id);

    if (!debt) {
      return {
        success: false as const,
        error: "La deuda no existe.",
      };
    }

    return {
      success: true as const,
      debt,
    };
  } catch (error) {
    console.error("Error obteniendo deuda:", error);

    return {
      success: false as const,
      error: "No se pudo obtener la deuda.",
    };
  }
}

export async function payDebt(data: {
  debtId: number;
  amount: number;
  notes?: string;
}) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    if (
      !Number.isInteger(data.debtId) ||
      data.debtId <= 0
    ) {
      return {
        success: false as const,
        error: "La deuda no es válida.",
      };
    }

    if (
      !Number.isFinite(data.amount) ||
      data.amount <= 0
    ) {
      return {
        success: false as const,
        error: "El monto debe ser mayor que 0.",
      };
    }

    const result = await payDebtRepo({
      debtId: data.debtId,
      amount: data.amount,
      notes: data.notes,
      userId: user.id,
    });

    return {
      success: true as const,
      debt: result.debt,
      payment: result.payment,
    };
  } catch (error) {
    console.error("Error procesando pago de deuda:", error);

    if (error instanceof Error) {
      switch (error.message) {
        case "INVALID_AMOUNT":
          return {
            success: false as const,
            error: "El monto no es válido.",
          };

        case "DEBT_NOT_FOUND":
          return {
            success: false as const,
            error: "La deuda no existe.",
          };

        case "DEBT_ALREADY_PAID":
          return {
            success: false as const,
            error: "Esta deuda ya está pagada.",
          };

        case "AMOUNT_EXCEEDS_DEBT":
          return {
            success: false as const,
            error: "El monto supera el saldo pendiente.",
          };

        case "CASHBOX_NOT_FOUND":
          return {
            success: false as const,
            error: "No tienes una caja activa.",
          };

        case "INSUFFICIENT_BALANCE":
          return {
            success: false as const,
            error: "El saldo de la caja no es suficiente.",
          };
      }
    }

    return {
      success: false as const,
      error: "No se pudo procesar el pago.",
    };
  }
}