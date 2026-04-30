import { LoginPanel } from "@/components/admin/login-panel";
import { getCurrentAdmin } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const admin = await getCurrentAdmin();
  if (admin) redirect("/admin");
  return <LoginPanel />;
}
