import Link from "next/link";
import { asc } from "drizzle-orm";

import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { AdminTable, ListHeader } from "@/components/admin/list";

export default async function CategoriesPage() {
  const rows = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return (
    <div>
      <ListHeader
        title="Categories"
        count={rows.length}
        newHref="/admin/categories/new"
        newLabel="New category"
      />
      <AdminTable>
        <thead className="bg-linen text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Slug</th>
            <th className="px-4 py-3 font-medium">Sort</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((category) => (
            <tr
              key={category.id}
              className="border-t border-border transition-colors hover:bg-linen"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/admin/categories/${category.id}`}
                  className="font-medium text-ink hover:text-gold"
                >
                  {category.name}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-ink-soft">
                {category.slug}
              </td>
              <td className="px-4 py-3 tabular-nums text-ink-soft">
                {category.sortOrder}
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </div>
  );
}
