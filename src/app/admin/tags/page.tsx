import { TagManager } from "@/components/admin/tag-manager";
import { listTags } from "@/lib/db/queries";

export default function TagsPage() {
  return <TagManager tags={listTags()} />;
}
