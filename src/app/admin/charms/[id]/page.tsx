import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { charms } from "@/lib/db/schema";
import { getCategories, getCharmCategoryIds } from "@/lib/catalog/queries";
import { DeleteButton } from "@/components/admin/delete-button";
import { ComponentForm } from "@/components/admin/component-form";
import { deleteCharm, updateCharm } from "../actions";

export default async function EditCharmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [charm] = await db
    .select()
    .from(charms)
    .where(eq(charms.id, id))
    .limit(1);
  if (!charm) notFound();

  const [categories, selectedCategoryIds] = await Promise.all([
    getCategories(),
    getCharmCategoryIds(charm.id),
  ]);

  return (
    <div>
      <Link
        href="/admin/charms"
        className="text-sm text-ink-soft hover:text-ink"
      >
        ← Charms
      </Link>
      <div className="mb-6 mt-2 flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl text-ink">Edit charm</h2>
        <DeleteButton
          action={deleteCharm.bind(null, charm.id)}
          confirmMessage={`Delete "${charm.name}"? This cannot be undone.`}
        />
      </div>
      <ComponentForm
        action={updateCharm}
        kind="charm"
        item={charm}
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
        submitLabel="Save changes"
      />
    </div>
  );
}
