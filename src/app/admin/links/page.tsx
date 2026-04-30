import { LinkManager } from "@/components/admin/link-manager";
import { listCategories, listLinks, listTags } from "@/lib/db/queries";

export default function LinksPage() {
  return <LinkManager links={listLinks(true)} categories={listCategories(true)} tags={listTags()} />;
}
