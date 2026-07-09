import Link from "next/link";

import { getCategories } from "@/lib/catalog/queries";
import { ComponentForm } from "@/components/admin/component-form";
import { createCharm } from "../actions";

export default async function NewCharmPage() {
  const categories = await getCategories();
  return (
    <div>
      <Link href="/admin/charms" className="text-sm text-ink-soft hover:text-ink">
        ← Charms
      </Link>
      <h2 className="mb-6 mt-2 font-serif text-2xl text-ink">New charm</h2>
      <ComponentForm
        action={createCharm}
        kind="charm"
        categories={categories}
        submitLabel="Create charm"
      />
    </div>
  );
}
