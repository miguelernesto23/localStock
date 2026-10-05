import { SignJWT, jwtVerify } from "jose";
import prisma from "../prisma";

const secret = process.env.AUTH_SECRET;

if (!secret) {
  throw new Error("AUTH_SECRET no está definido");
}

const secretKey = new TextEncoder().encode(secret);

export async function createSession(userId: number) {
  const token = await new SignJWT({
    userId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const userId = (payload as { userId: number }).userId;

    const session = await prisma.session.findUnique({
      where: { token },
    });

    if (!session || new Date() > session.expiresAt) {
      return null;
    }

    return { userId };
  } catch {
    return null;
  }
}

export async function invalidateSession(token: string) {
  await prisma.session.deleteMany({
    where: { token },
  });
}
