import "server-only";

import { eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { bases, beads, charms } from "@/lib/db/schema";
import type { PlacedComponent } from "@/lib/studio/types";

/**
 * Authoritative price for a design, computed server-side from the live catalog.
 * Never trust a client-supplied price (CLAUDE.md). Counts duplicates correctly.
 */
export async function computeDesignPriceInPiastres(
  baseId: string | null,
  components: Pick<PlacedComponent, "kind" | "refId">[]
): Promise<number> {
  let total = 0;

  if (baseId) {
    const [base] = await db
      .select({ price: bases.priceInPiastres })
      .from(bases)
      .where(eq(bases.id, baseId))
      .limit(1);
    total += base?.price ?? 0;
  }

  const beadIds = components.filter((c) => c.kind === "bead").map((c) => c.refId);
  const charmIds = components.filter((c) => c.kind === "charm").map((c) => c.refId);

  if (beadIds.length) {
    const rows = await db
      .select({ id: beads.id, price: beads.priceInPiastres })
      .from(beads)
      .where(inArray(beads.id, beadIds));
    const priceById = new Map(rows.map((r) => [r.id, r.price]));
    for (const c of components) {
      if (c.kind === "bead") total += priceById.get(c.refId) ?? 0;
    }
  }

  if (charmIds.length) {
    const rows = await db
      .select({ id: charms.id, price: charms.priceInPiastres })
      .from(charms)
      .where(inArray(charms.id, charmIds));
    const priceById = new Map(rows.map((r) => [r.id, r.price]));
    for (const c of components) {
      if (c.kind === "charm") total += priceById.get(c.refId) ?? 0;
    }
  }

  return total;
}
