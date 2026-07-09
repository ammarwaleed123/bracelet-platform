import type { StudioCatalog, StudioDesignState } from "@/lib/studio/types";
import { DEFAULT_SIZE_CM } from "@/lib/studio/store";

/**
 * First-run design: a clean, empty rose gold chain the customer builds on.
 *
 * DECISION: the owner prefers starting from an empty chain over a pre-loaded
 * beaded starter (this overrides spec §4's "never an empty circle" — the
 * first-run hint keeps it inviting). Prefers rose gold, then any in-stock base.
 */
const PREFERRED_BASE_SLUGS = [
  "rose-gold-chain",
  "gold-filled-cable-chain",
  "sterling-silver-chain",
];

export function buildStarterDesign(catalog: StudioCatalog): StudioDesignState {
  const base =
    PREFERRED_BASE_SLUGS.map((slug) =>
      catalog.bases.find((b) => b.slug === slug)
    ).find(Boolean) ??
    catalog.bases.find((b) => b.stockQuantity > 0) ??
    catalog.bases[0];

  return {
    baseId: base?.id ?? null,
    sizeCm: DEFAULT_SIZE_CM,
    components: [],
  };
}
