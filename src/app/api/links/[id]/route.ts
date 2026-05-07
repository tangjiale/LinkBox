import { requireAdminApi } from "@/lib/auth/guard";
import { readJson } from "@/lib/api/request";
import { deleteLink, updateLink } from "@/lib/db/queries";
import { toErrorResponse } from "@/lib/utils/errors";
import { linkSchema } from "@/lib/validators/linkbox";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id } = await context.params;
  const body = await readJson(request);
  if (body.error) return body.error;
  const parsed = linkSchema.safeParse(body.data);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "链接数据不合法" }, { status: 400 });
  }
  try {
    await updateLink(id, parsed.data);
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "更新链接失败");
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id } = await context.params;
  try {
    await deleteLink(id);
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "删除链接失败");
  }
}
