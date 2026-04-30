import { requireAdminApi } from "@/lib/auth/guard";
import { readJson } from "@/lib/api/request";
import { createLink, listLinks } from "@/lib/db/queries";
import { toErrorResponse } from "@/lib/utils/errors";
import { linkSchema } from "@/lib/validators/linkbox";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  return Response.json({ links: listLinks(true) });
}

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const body = await readJson(request);
  if (body.error) return body.error;
  const parsed = linkSchema.safeParse(body.data);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "链接数据不合法" }, { status: 400 });
  }
  try {
    createLink(parsed.data);
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建链接失败");
  }
}
