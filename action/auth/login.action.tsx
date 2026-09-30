"use server";
import { createSeassion } from "@/lib/auth/session";
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
      error: "Datos Invalidos",
    };
  }

  const { user_name, password } = result.data;

  const user = await prisma.user.findUnique({
    where: {
      user_name,
    },
  });

  if (!user) {
    return {
      error: "Usuario o contraseña incorrectos",
    };
  }

  const passwordValid = await bcrypt.compare(password, user.password);

  if (!passwordValid) {
    return {
      error: "Usuario o contraseña incorrectos",
    };
  }

  const token = await createSeassion(user.id);

  const cookieStore = await cookies();

  cookieStore.set("Sesion", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/");
}
