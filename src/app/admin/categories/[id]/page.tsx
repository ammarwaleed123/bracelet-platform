import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCategory, updateCategory } from "../actions";
import { CategoryForm } from "../category-form";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!category) notFound();

  return (
    <div>
      <Link
        href="/admin/categories"
        className="text-sm text-ink-soft hover:text-ink"
      >
        ← Categories
      </Link>
      <div className="mb-6 mt-2 flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl text-ink">Edit category</h2>
        <DeleteButton
          action={deleteCategory.bind(null, category.id)}
          confirmMessage={`Delete "${category.name}"? Items keep existing but lose this tag.`}
        />
      </div>
      <CategoryForm
        action={updateCategory}
        category={category}
        submitLabel="Save changes"
      />
    </div>
  );
}
