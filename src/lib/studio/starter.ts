import { nanoid } from "nanoid";

import type { PlacedComponent, StudioCatalog } from "@/lib/studio/types";
import { DEFAULT_SIZE_CM } from "@/lib/studio/store";
import { circumferenceMm } from "@/lib/studio/derive";
import type { StudioDesignState } from "@/lib/studio/types";

/**
 * A beautiful pre-loaded starter bracelet for first-time visitors (spec §4 —
 * never an empty circle). Prefers a curated set of stones by slug; falls back
 * to the first available in-stock beads so it always produces something.
 */
const PREFERRED_BASE_SLUGS = ["gold-filled-cable-chain", "sterling-silver-chain"];
const PREFERRED_BEAD_SLUGS = [
  "amethyst",
  "rose-quartz",
  "moonstone",
  "clear-quartz",
  "rose-quartz",
  "amethyst",
];
const PREFERRED_CHARM_SLUGS = ["crescent-moon"];

export function buildStarterDesign(catalog: StudioCatalog): StudioDesignState {
  const inStock = <T extends { stockQuantity: number }>(x: T) =>
    x.stockQuantity > 0;

  const base =
    PREFERRED_BASE_SLUGS.map((slug) =>
      catalog.bases.find((b) => b.slug === slug)
    ).find(Boolean) ??
    catalog.bases.find(inStock) ??
    catalog.bases[0];

  const sizeCm = DEFAULT_SIZE_CM;
  const budgetMm = circumferenceMm(sizeCm);

  let beadPicks = PREFERRED_BEAD_SLUGS.map((slug) =>
    catalog.beads.find((b) => b.slug === slug)
  ).filter((b): b is (typeof catalog.beads)[number] => Boolean(b));
  if (beadPicks.length === 0) {
    beadPicks = catalog.beads.filter(inStock).slice(0, 6);
  }
  const charmPicks = PREFERRED_CHARM_SLUGS.map((slug) =>
    catalog.charms.find((c) => c.slug === slug)
  ).filter((c): c is (typeof catalog.charms)[number] => Boolean(c));

  const components: PlacedComponent[] = [];
  let used = 0;
  for (const b of beadPicks) {
    if (used + b.diameterMm > budgetMm) break;
    components.push({ uid: nanoid(8), kind: "bead", refId: b.id });
    used += b.diameterMm;
  }
  for (const c of charmPicks) {
    if (used + c.diameterMm > budgetMm) break;
    components.push({ uid: nanoid(8), kind: "charm", refId: c.id });
    used += c.diameterMm;
  }

  return { baseId: base?.id ?? null, sizeCm, components };
}
