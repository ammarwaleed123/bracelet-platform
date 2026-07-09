import "server-only";

import { asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  beadCategories,
  beads,
  bases,
  categories,
  charmCategories,
  charms,
} from "@/lib/db/schema";
import type {
  StudioBead,
  StudioCatalog,
  StudioCharm,
} from "@/lib/studio/types";

/**
 * Load the active catalog for the studio. Out-of-stock items are included on
 * purpose — the studio disables them rather than hiding them (spec §4). Only
 * inactive (admin-hidden) items are excluded.
 */
export async function getStudioCatalog(): Promise<StudioCatalog> {
  const [baseRows, beadRows, charmRows, categoryRows, beadCats, charmCats] =
    await Promise.all([
      db
        .select()
        .from(bases)
        .where(eq(bases.isActive, true))
        .orderBy(asc(bases.sortOrder), asc(bases.name)),
      db
        .select()
        .from(beads)
        .where(eq(beads.isActive, true))
        .orderBy(asc(beads.sortOrder), asc(beads.name)),
      db
        .select()
        .from(charms)
        .where(eq(charms.isActive, true))
        .orderBy(asc(charms.sortOrder), asc(charms.name)),
      db
        .select()
        .from(categories)
        .orderBy(asc(categories.sortOrder), asc(categories.name)),
      db.select().from(beadCategories),
      db.select().from(charmCategories),
    ]);

  const beadCatMap = groupCategoryIds(beadCats, "beadId");
  const charmCatMap = groupCategoryIds(charmCats, "charmId");

  const studioBeads: StudioBead[] = beadRows.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    stoneType: b.stoneType,
    meaning: b.meaning,
    colorHex: b.colorHex,
    finish: b.finish,
    diameterMm: Number(b.diameterMm),
    priceInPiastres: b.priceInPiastres,
    stockQuantity: b.stockQuantity,
    imageUrl: b.imageUrl,
    material3dParams: b.material3dParams,
    categoryIds: beadCatMap.get(b.id) ?? [],
  }));

  const studioCharms: StudioCharm[] = charmRows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    meaning: c.meaning,
    colorHex: c.colorHex,
    charmShape: c.charmShape,
    letterValue: c.letterValue,
    diameterMm: Number(c.diameterMm),
    priceInPiastres: c.priceInPiastres,
    stockQuantity: c.stockQuantity,
    imageUrl: c.imageUrl,
    material3dParams: c.material3dParams,
    categoryIds: charmCatMap.get(c.id) ?? [],
  }));

  return {
    bases: baseRows.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      type: b.type,
      colorHex: b.colorHex,
      priceInPiastres: b.priceInPiastres,
      stockQuantity: b.stockQuantity,
      imageUrl: b.imageUrl,
      model3dParams: b.model3dParams,
    })),
    beads: studioBeads,
    charms: studioCharms,
    categories: categoryRows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),
  };
}

function groupCategoryIds<K extends string>(
  rows: (Record<K, string> & { categoryId: string })[],
  key: K
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const ownerId = row[key];
    const list = map.get(ownerId);
    if (list) list.push(row.categoryId);
    else map.set(ownerId, [row.categoryId]);
  }
  return map;
}
