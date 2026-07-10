import "server-only";

import { and, asc, eq, gt } from "drizzle-orm";

import { db } from "@/lib/db";
import { beads } from "@/lib/db/schema";

/** Minimal visual spec for a bead in the home-page hero animation. */
export type HeroBead = {
  colorHex: string;
  diameterMm: number;
  roughness: number;
  metalness: number;
  transmission: number;
};

/** A handful of real, in-stock beads to assemble into the hero bracelet. */
export async function getHeroBeads(limit = 14): Promise<HeroBead[]> {
  const rows = await db
    .select({
      colorHex: beads.colorHex,
      diameterMm: beads.diameterMm,
      material: beads.material3dParams,
    })
    .from(beads)
    .where(and(eq(beads.isActive, true), gt(beads.stockQuantity, 0)))
    .orderBy(asc(beads.sortOrder))
    .limit(limit);

  return rows.map((r) => ({
    colorHex: r.material?.color ?? r.colorHex,
    diameterMm: Number(r.diameterMm),
    roughness: r.material?.roughness ?? 0.3,
    metalness: r.material?.metalness ?? 0,
    transmission: r.material?.transmission ?? 0,
  }));
}
