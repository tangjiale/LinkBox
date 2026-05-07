import { CategoryManager } from "@/components/admin/category-manager";
import { listCategories } from "@/lib/db/queries";

export default async function CategoriesPage() {
  return <CategoryManager categories={await listCategories(true)} />;
}
