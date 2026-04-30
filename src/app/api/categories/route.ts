import { requireAdminApi } from "@/lib/auth/guard";
import { readJson } from "@/lib/api/request";
import { createCategory, listCategories } from "@/lib/db/queries";
import { toErrorResponse } from "@/lib/utils/errors";
import { categorySchema } from "@/lib/validators/linkbox";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  return Response.json({ categories: listCategories(true) });
}

export async function POST(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;
  const body = await readJson(request);
  if (body.error) return body.error;
  const parsed = categorySchema.safeParse(body.data);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "分类数据不合法" }, { status: 400 });
  }
  try {
    return Response.json({ category: createCategory(parsed.data) }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "创建分类失败");
  }
}
