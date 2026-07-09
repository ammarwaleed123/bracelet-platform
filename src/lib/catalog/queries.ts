import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { beadCategories, categories, charmCategories } from "@/lib/db/schema";

/** All categories, ordered for display in admin forms and filters. */
export async function getCategories() {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getBeadCategoryIds(beadId: string): Promise<string[]> {
  const rows = await db
    .select({ id: beadCategories.categoryId })
    .from(beadCategories)
    .where(eq(beadCategories.beadId, beadId));
  return rows.map((r) => r.id);
}

export async function getCharmCategoryIds(charmId: string): Promise<string[]> {
  const rows = await db
    .select({ id: charmCategories.categoryId })
    .from(charmCategories)
    .where(eq(charmCategories.charmId, charmId));
  return rows.map((r) => r.id);
}
