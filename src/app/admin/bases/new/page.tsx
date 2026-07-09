import Link from "next/link";

import { createBase } from "../actions";
import { BaseForm } from "../base-form";

export default function NewBasePage() {
  return (
    <div>
      <Link
        href="/admin/bases"
        className="text-sm text-ink-soft hover:text-ink"
      >
        ← Bases
      </Link>
      <h2 className="mb-6 mt-2 font-serif text-2xl text-ink">New base</h2>
      <BaseForm action={createBase} submitLabel="Create base" />
    </div>
  );
}
