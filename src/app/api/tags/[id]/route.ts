import { requireAdminApi } from "@/lib/auth/guard";
import { readJson } from "@/lib/api/request";
import { deleteTag, updateTag } from "@/lib/db/queries";
import { toErrorResponse } from "@/lib/utils/errors";
import { tagSchema } from "@/lib/validators/linkbox";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id } = await context.params;
  const body = await readJson(request);
  if (body.error) return body.error;
  const parsed = tagSchema.safeParse(body.data);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "标签数据不合法" }, { status: 400 });
  }
  try {
    updateTag(id, parsed.data);
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "更新标签失败");
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const { id } = await context.params;
  try {
    deleteTag(id);
    return Response.json({ ok: true });
  } catch (error) {
    return toErrorResponse(error, "删除标签失败");
  }
}
