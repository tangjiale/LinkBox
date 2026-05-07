import { requireAdminApi } from "@/lib/auth/guard";
import { resolveFaviconUrl } from "@/lib/favicon";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdminApi();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url") ?? "";
  if (!url.trim()) {
    return Response.json({ error: "请先填写网站 URL" }, { status: 400 });
  }

  try {
    const iconUrl = await resolveFaviconUrl(url);
    return Response.json({ iconUrl });
  } catch (error) {
    const message = error instanceof Error && error.message ? error.message : "读取网站图标失败";
    return Response.json({ error: message }, { status: 400 });
  }
}
