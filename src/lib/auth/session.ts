import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { compare } from "bcryptjs";
import { getAdminByUsername } from "@/lib/db/queries";

export const sessionCookieName = "linkbox_session";

const maxAgeSeconds = 60 * 60 * 24 * 7;

function secret() {
  if (process.env.LINKBOX_SESSION_SECRET) return process.env.LINKBOX_SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("生产环境必须设置 LINKBOX_SESSION_SECRET。");
  }
  return "linkbox-local-dev-secret";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function validateCredentials(username: string, password: string) {
  const admin = getAdminByUsername(username);
  if (!admin) return false;
  return compare(password, admin.passwordHash);
}

export function createSessionToken(username: string) {
  const expiresAt = Date.now() + maxAgeSeconds * 1000;
  const payload = Buffer.from(JSON.stringify({ username, expiresAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token?: string) {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      username: string;
      expiresAt: number;
    };
    if (!parsed.username || Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const session = readSessionToken(cookieStore.get(sessionCookieName)?.value);
  if (!session) return null;
  const admin = getAdminByUsername(session.username);
  if (!admin) return null;
  return { id: admin.id, username: admin.username };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
