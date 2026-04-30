import { loginSchema } from "@/lib/validators/linkbox";
import { createSessionToken, sessionCookieName, sessionCookieOptions, validateCredentials } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const payload = loginSchema.safeParse(await request.json());
  if (!payload.success) {
    return Response.json({ error: payload.error.issues[0]?.message ?? "登录信息不完整" }, { status: 400 });
  }

  const valid = await validateCredentials(payload.data.username, payload.data.password);
  if (!valid) {
    return Response.json({ error: "账号或密码错误" }, { status: 401 });
  }

  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${sessionCookieName}=${createSessionToken(payload.data.username)}; Path=${sessionCookieOptions().path}; Max-Age=${
      sessionCookieOptions().maxAge
    }; HttpOnly; SameSite=Lax${sessionCookieOptions().secure ? "; Secure" : ""}`,
  );
  return response;
}
