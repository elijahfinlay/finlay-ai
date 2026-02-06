import { cookies } from "next/headers";
import { db } from "./db";
import crypto from "crypto";

const SESSION_COOKIE = "finlay_session";
const LOCAL_USER_EMAIL = "local@finlay.ai";

// For local use: auto-create and auto-login a local user
async function ensureLocalUser() {
  let user = await db.user.findUnique({ where: { email: LOCAL_USER_EMAIL } });
  if (!user) {
    user = await db.user.create({
      data: {
        email: LOCAL_USER_EMAIL,
        name: "Local User",
        creditsBalance: 99999,
        plan: "pro",
      },
    });
  }
  return user;
}

export async function getUserFromCookie(): Promise<{
  id: string;
  email: string;
  name: string | null;
  plan: string;
  creditsBalance: number;
  creditsUsed: number;
} | null> {
  // Auto-login: always return the local user
  const user = await ensureLocalUser();
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.plan,
    creditsBalance: user.creditsBalance,
    creditsUsed: user.creditsUsed,
  };
}

// Keep these for API compatibility but they're not needed for local use
export async function generateToken(email: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await db.authToken.deleteMany({ where: { email } });
  await db.authToken.create({ data: { email, token, expiresAt } });
  return token;
}

export async function verifyToken(token: string): Promise<string | null> {
  const authToken = await db.authToken.findUnique({ where: { token } });
  if (!authToken || authToken.expiresAt < new Date()) return null;
  await db.authToken.delete({ where: { id: authToken.id } });
  return authToken.email;
}

export async function createSession(email: string): Promise<string> {
  const user = await ensureLocalUser();
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return user.id;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
