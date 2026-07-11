import { nanoid } from "nanoid";

import { buildStarterDesign } from "@/lib/studio/starter";
import type {
  PlacedComponent,
  StudioCatalog,
  StudioDesignState,
} from "@/lib/studio/types";

/**
 * A seeded demo bracelet so /studio/ar always shows something attractive when
 * the visitor has no live design or autosaved draft. Reuses the studio's base
 * pick, then strings a FULL strand of beads around the wrist (so it reads as a
 * finished bracelet, not a few beads on bare wire) with a charm centerpiece.
 */
export function buildDemoDesign(catalog: StudioCatalog): StudioDesignState {
  const { baseId, sizeCm } = buildStarterDesign(catalog);

  const inStock = catalog.beads.filter((b) => b.stockQuantity > 0);
  const beads = inStock.length > 0 ? inStock : catalog.beads;
  const primary = beads[0];
  if (!primary) return { baseId, sizeCm, components: [] };
  // A subtle accent bead in a different tone, if the catalog offers one.
  const accent = beads.find((b) => b.colorHex !== primary.colorHex) ?? primary;
  const charm =
    catalog.charms.find((c) => c.stockQuantity > 0) ?? catalog.charms[0];

  // Fill ~the wrist circumference so beads wrap the whole ring.
  const circumferenceMm = sizeCm * 10;
  const target = circumferenceMm * 0.98 - (charm?.diameterMm ?? 0);

  const components: PlacedComponent[] = [];
  let used = 0;
  let i = 0;
  while (used < target && components.length < 60) {
    // Mostly the primary tone, with an accent every fifth bead.
    const bead = i > 0 && i % 5 === 0 ? accent : primary;
    components.push({ uid: nanoid(8), kind: "bead", refId: bead.id });
    used += bead.diameterMm;
    i++;
  }

  if (charm) {
    const mid = Math.floor(components.length / 2);
    components.splice(mid, 0, { uid: nanoid(8), kind: "charm", refId: charm.id });
  }

  return { baseId, sizeCm, components };
}
