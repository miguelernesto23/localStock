"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function LogoutAction() {
  const cookieStore = await cookies();

  cookieStore.delete("Sesion");

  redirect("/login");
}