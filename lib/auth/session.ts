import { SignJWT, jwtVerify } from "jose";

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

  return token;
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey);

    return payload as {
      userId: number;
    };
  } catch {
    return null;
  }
}