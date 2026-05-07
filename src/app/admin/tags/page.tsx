import { TagManager } from "@/components/admin/tag-manager";
import { listTags } from "@/lib/db/queries";

export default async function TagsPage() {
  return <TagManager tags={await listTags()} />;
}
