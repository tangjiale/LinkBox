import { AdminFrame } from "@/components/admin/admin-frame";
import { requireAdminPage } from "@/lib/auth/guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  return <AdminFrame username={admin.username}>{children}</AdminFrame>;
}
