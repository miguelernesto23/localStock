"use server";

import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  passwordSchema,
  type PasswordFormData,
} from "@/schema/password.schema";

export async function changePassword(data: PasswordFormData) {
  try {
    const validation = passwordSchema.safeParse(data);

    if (!validation.success) {
      return {
        success: false,
        message: "Los datos proporcionados no son válidos.",
      };
    }

    const { currentPassword, newPassword } = validation.data;

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return {
        success: false,
        message: "No estás autenticado.",
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: currentUser.id,
      },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "Usuario no encontrado.",
      };
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return {
        success: false,
        message: "La contraseña actual es incorrecta.",
      };
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);

    if (samePassword) {
      return {
        success: false,
        message: "La nueva contraseña debe ser diferente.",
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    return {
      success: true,
      message: "Contraseña actualizada correctamente.",
    };
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error);

    return {
      success: false,
      message: "Ocurrió un error al cambiar la contraseña.",
    };
  }
}
