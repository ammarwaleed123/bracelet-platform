import { nanoid } from "nanoid";

import { buildStarterDesign } from "@/lib/studio/starter";
import type { StudioCatalog, StudioDesignState } from "@/lib/studio/types";

/**
 * A seeded demo bracelet so /studio/ar always shows something attractive when
 * the visitor has no live design or autosaved draft. Reuses the studio's base
 * pick, then strings a handful of in-stock beads (plus a charm centerpiece).
 */
export function buildDemoDesign(catalog: StudioCatalog): StudioDesignState {
  const base = buildStarterDesign(catalog);

  const inStockBeads = catalog.beads.filter((b) => b.stockQuantity > 0);
  const beads = inStockBeads.length > 0 ? inStockBeads : catalog.beads;
  const charm =
    catalog.charms.find((c) => c.stockQuantity > 0) ?? catalog.charms[0];

  const components: StudioDesignState["components"] = [];
  const pick = (i: number) => beads[i % beads.length];

  // A gentle, symmetric arrangement with a charm at the front.
  const pattern = [0, 1, 2, 1, 0];
  for (const i of pattern) {
    const bead = pick(i);
    if (bead) components.push({ uid: nanoid(8), kind: "bead", refId: bead.id });
  }
  if (charm) {
    const mid = Math.floor(components.length / 2);
    components.splice(mid, 0, { uid: nanoid(8), kind: "charm", refId: charm.id });
  }

  return { baseId: base.baseId, sizeCm: base.sizeCm, components };
}
