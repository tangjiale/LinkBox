import { PublicHome } from "@/components/public/public-home";
import { getPublicData } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <PublicHome data={await getPublicData()} />;
}
