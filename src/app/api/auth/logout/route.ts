import { sessionCookieName } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", `${sessionCookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
  return response;
}
