import { getCurrentAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getCurrentAdmin();
  return Response.json({ admin });
}
