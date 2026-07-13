import Link from "next/link";
import { count } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import {
  bases,
  beads,
  categories,
  charms,
  collections,
  designs,
} from "@/lib/db/schema";
import { AiAdminSection } from "@/components/admin/ai-admin-section";

async function countFrom(table: PgTable): Promise<number> {
  const [row] = await db.select({ n: count() }).from(table);
  return row?.n ?? 0;
}

export default async function AdminDashboard() {
  const [baseN, beadN, charmN, categoryN, collectionN, designN] =
    await Promise.all([
      countFrom(bases),
      countFrom(beads),
      countFrom(charms),
      countFrom(categories),
      countFrom(collections),
      countFrom(designs),
    ]);

  const cards = [
    { label: "Bases", href: "/admin/bases", n: baseN },
    { label: "Beads", href: "/admin/beads", n: beadN },
    { label: "Charms", href: "/admin/charms", n: charmN },
    { label: "Categories", href: "/admin/categories", n: categoryN },
  ];

  return (
    <div className="space-y-8">
      <AiAdminSection />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-colors hover:bg-linen"
          >
            <p className="label-caps">{card.label}</p>
            <p className="mt-2 font-serif text-3xl text-ink">{card.n}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-linen p-5 text-sm text-ink-soft">
        <p>
          {collectionN} collections · {designN} brand designs. Collections and
          designs are managed in the gallery milestone; this manager covers the
          component catalog.
        </p>
      </div>
    </div>
  );
}
