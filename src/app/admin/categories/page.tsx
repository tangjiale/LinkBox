import { CategoryManager } from "@/components/admin/category-manager";
import { listCategories } from "@/lib/db/queries";

export default function CategoriesPage() {
  return <CategoryManager categories={listCategories(true)} />;
}
