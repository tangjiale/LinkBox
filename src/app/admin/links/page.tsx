import { LinkManager } from "@/components/admin/link-manager";
import { listCategories, listLinks, listTags } from "@/lib/db/queries";

export default async function LinksPage() {
  const [links, categories, tags] = await Promise.all([listLinks(true), listCategories(true), listTags()]);
  return <LinkManager links={links} categories={categories} tags={tags} />;
}
