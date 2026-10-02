"use server";
import prisma from "@/lib/prisma";
import { registerSchema } from "@/schema/register.schema";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export async function RegistreAction(formData: FormData) {
  const result = registerSchema.safeParse({
    name: formData.get("name"),
    user_name: formData.get("user_name"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return {
      error: "Datos Invalidos",
    };
  }

  const { name, user_name, password } = result.data;

  const ExistingUser = await prisma.user.findUnique({
    where: {
      user_name,
    },
  });
  if (ExistingUser) {
    return {
      error: "El nombre de usuario ya existe",
    };
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      user_name,
      password: hashedPassword,
    },
  });
  const token = await createSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set("Sesion", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV == "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/");
}
