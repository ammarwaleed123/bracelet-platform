import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { bases } from "@/lib/db/schema";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteBase, updateBase } from "../actions";
import { BaseForm } from "../base-form";

export default async function EditBasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [base] = await db.select().from(bases).where(eq(bases.id, id)).limit(1);
  if (!base) notFound();

  return (
    <div>
      <Link href="/admin/bases" className="text-sm text-ink-soft hover:text-ink">
        ← Bases
      </Link>
      <div className="mb-6 mt-2 flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl text-ink">Edit base</h2>
        <DeleteButton
          action={deleteBase.bind(null, base.id)}
          confirmMessage={`Delete "${base.name}"? This cannot be undone.`}
        />
      </div>
      <BaseForm action={updateBase} base={base} submitLabel="Save changes" />
    </div>
  );
}
