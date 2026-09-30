"use server";

import { getCurrentUser } from "@/lib/auth/current-user";

import {
  getCashBoxesRepo,
  getActiveCashBoxRepo,
  createCashBoxRepo,
  getCashMovementsRepo,
  addCapitalRepo,
} from "@/repository/cashbox.repository";

type CreateCashBoxInput = {
  name: string;
  initialCapital: number;
};

export async function getCashBoxes() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    const cashBoxes = await getCashBoxesRepo(user.id);

    return {
      success: true as const,
      cashBoxes,
    };
  } catch (error) {
    console.error("Error obteniendo cajas:", error);

    return {
      success: false as const,
      error: "No se pudieron cargar las cajas.",
    };
  }
}

export async function getActiveCashBox() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    const cashBox = await getActiveCashBoxRepo(user.id);

    return {
      success: true as const,
      cashBox,
    };
  } catch (error) {
    console.error("Error obteniendo caja activa:", error);

    return {
      success: false as const,
      error: "No se pudo obtener la caja activa.",
    };
  }
}
export async function getCashMovements(cashBoxId: number) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    const movements = await getCashMovementsRepo(cashBoxId, user.id);

    return {
      success: true as const,
      movements,
    };
  } catch (error) {
    console.error("Error obteniendo movimientos de caja:", error);

    return {
      success: false as const,
      error: "No se pudieron cargar los movimientos.",
    };
  }
}
export async function createCashBox(data: CreateCashBoxInput) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    if (!data.name.trim()) {
      return {
        success: false as const,
        error: "El nombre de la caja es obligatorio.",
      };
    }

    if (!Number.isFinite(data.initialCapital) || data.initialCapital < 0) {
      return {
        success: false as const,
        error: "El capital inicial no es válido.",
      };
    }

    const cashBox = await createCashBoxRepo({
      name: data.name.trim(),
      initialCapital: data.initialCapital,
      userId: user.id,
    });

    return {
      success: true as const,
      cashBox,
    };
  } catch (error) {
    console.error("Error creando caja:", error);

    return {
      success: false as const,
      error: "No se pudo crear la caja.",
    };
  }
}
type AddCapitalInput = {
  cashBoxId: number;
  amount: number;
};

export async function addCapital(data: AddCapitalInput) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    if (!Number.isInteger(data.cashBoxId) || data.cashBoxId <= 0) {
      return {
        success: false as const,
        error: "La caja seleccionada no es válida.",
      };
    }

    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      return {
        success: false as const,
        error: "El monto debe ser mayor que 0.",
      };
    }

    const cashBox = await addCapitalRepo({
      cashBoxId: data.cashBoxId,
      amount: data.amount,
      userId: user.id,
    });

    return {
      success: true as const,
      cashBox,
    };
  } catch (error) {
    console.error("Error ingresando capital:", error);

    if (error instanceof Error && error.message === "CASHBOX_NOT_FOUND") {
      return {
        success: false as const,
        error: "La caja no existe o no está activa.",
      };
    }

    if (error instanceof Error && error.message === "INVALID_AMOUNT") {
      return {
        success: false as const,
        error: "El monto de capital no es válido.",
      };
    }

    return {
      success: false as const,
      error: "No se pudo ingresar el capital.",
    };
  }
}
export async function getActiveCashBoxBalance() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return {
        success: false as const,
        error: "No estás autenticado.",
      };
    }

    const cashBox = await getActiveCashBoxRepo(user.id);

    if (!cashBox) {
      return {
        success: false as const,
        error: "No tienes una caja activa.",
      };
    }

    return {
      success: true as const,
      balance: cashBox.currentBalance,
      currency: cashBox.currency,
      name: cashBox.name,
    };
  } catch (error) {
    console.error("Error obteniendo saldo de caja:", error);

    return {
      success: false as const,
      error: "No se pudo obtener el saldo de la caja.",
    };
  }
}