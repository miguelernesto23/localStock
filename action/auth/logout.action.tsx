"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { invalidateSession } from "@/lib/auth/session";

export async function LogoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get("Sesion")?.value;

  // 1. Invalidar sesión en BD
  if (token) {
    await invalidateSession(token);
  }

  // 2. Eliminar cookie
  cookieStore.delete("Sesion");

  redirect("/login");
}