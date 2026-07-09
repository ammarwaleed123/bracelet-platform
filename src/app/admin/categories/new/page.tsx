import Link from "next/link";

import { createCategory } from "../actions";
import { CategoryForm } from "../category-form";

export default function NewCategoryPage() {
  return (
    <div>
      <Link
        href="/admin/categories"
        className="text-sm text-ink-soft hover:text-ink"
      >
        ← Categories
      </Link>
      <h2 className="mb-6 mt-2 font-serif text-2xl text-ink">New category</h2>
      <CategoryForm action={createCategory} submitLabel="Create category" />
    </div>
  );
}
