import { redirect } from "next/navigation";
import { getCurrentAdmin } from "./session";

export async function requireAdminPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  return admin;
}

export async function requireAdminApi() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return Response.json({ error: "未登录或登录已过期" }, { status: 401 });
  }
  return null;
}
