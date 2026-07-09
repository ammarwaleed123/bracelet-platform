import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { beads } from "@/lib/db/schema";
import { getBeadCategoryIds, getCategories } from "@/lib/catalog/queries";
import { DeleteButton } from "@/components/admin/delete-button";
import { ComponentForm } from "@/components/admin/component-form";
import { deleteBead, updateBead } from "../actions";

export default async function EditBeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [bead] = await db.select().from(beads).where(eq(beads.id, id)).limit(1);
  if (!bead) notFound();

  const [categories, selectedCategoryIds] = await Promise.all([
    getCategories(),
    getBeadCategoryIds(bead.id),
  ]);

  return (
    <div>
      <Link href="/admin/beads" className="text-sm text-ink-soft hover:text-ink">
        ← Beads
      </Link>
      <div className="mb-6 mt-2 flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl text-ink">Edit bead</h2>
        <DeleteButton
          action={deleteBead.bind(null, bead.id)}
          confirmMessage={`Delete "${bead.name}"? This cannot be undone.`}
        />
      </div>
      <ComponentForm
        action={updateBead}
        kind="bead"
        item={bead}
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
        submitLabel="Save changes"
      />
    </div>
  );
}
