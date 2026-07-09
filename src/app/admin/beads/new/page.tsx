import Link from "next/link";

import { getCategories } from "@/lib/catalog/queries";
import { ComponentForm } from "@/components/admin/component-form";
import { createBead } from "../actions";

export default async function NewBeadPage() {
  const categories = await getCategories();
  return (
    <div>
      <Link href="/admin/beads" className="text-sm text-ink-soft hover:text-ink">
        ← Beads
      </Link>
      <h2 className="mb-6 mt-2 font-serif text-2xl text-ink">New bead</h2>
      <ComponentForm
        action={createBead}
        kind="bead"
        categories={categories}
        submitLabel="Create bead"
      />
    </div>
  );
}
