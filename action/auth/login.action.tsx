"use server";

import { createSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma";
import { loginSchema } from "@/schema/login.schema";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function LoginAction(formData: FormData) {
  const result = loginSchema.safeParse({
    user_name: formData.get("user_name"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      error: "Revisa los datos introducidos.",
    };
  }

  const { user_name, password } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { user_name },
      select: { id: true, password: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return { error: "Usuario o contraseña incorrectos" };
    }

    const token = await createSession(user.id);
    const cookieStore = await cookies();

    cookieStore.set("Sesion", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch (error) {
    console.error("Error login:", error);
    return { error: "No se pudo iniciar sesión" };
  }

  redirect("/");
}
