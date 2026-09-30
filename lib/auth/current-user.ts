import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { verifySession } from "./session";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const token = cookieStore.get("Sesion")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      id: true,
      name: true,
      user_name: true,
    },
  });

  return user;
}