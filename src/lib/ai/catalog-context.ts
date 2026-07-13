import "server-only";

import { getStudioCatalog } from "@/lib/catalog/studio";
import type { StudioCatalog } from "@/lib/studio/types";
import type { CatalogContext } from "./types";

const inStock = (x: { stockQuantity: number }) => x.stockQuantity > 0;
const short = (s: string | null, n = 70) =>
  s && s.length > n ? `${s.slice(0, n)}…` : s;

/**
 * Load the active, in-stock catalog once and return both the full StudioCatalog
 * (for server-side validation/pricing) and a lean CatalogContext for the model.
 */
export async function loadCatalogContext(): Promise<{
  catalog: StudioCatalog;
  context: CatalogContext;
}> {
  const catalog = await getStudioCatalog();
  const context: CatalogContext = {
    bases: catalog.bases.filter(inStock).map((b) => ({
      id: b.id,
      name: b.name,
      type: b.type,
      colorHex: b.colorHex,
      priceInPiastres: b.priceInPiastres,
    })),
    beads: catalog.beads.filter(inStock).map((b) => ({
      id: b.id,
      name: b.name,
      stone: b.stoneType,
      meaning: short(b.meaning),
      colorHex: b.colorHex,
      finish: b.finish,
      diameterMm: b.diameterMm,
      priceInPiastres: b.priceInPiastres,
    })),
    charms: catalog.charms.filter(inStock).map((c) => ({
      id: c.id,
      name: c.name,
      meaning: short(c.meaning),
      colorHex: c.colorHex,
      diameterMm: c.diameterMm,
      priceInPiastres: c.priceInPiastres,
    })),
  };
  return { catalog, context };
}
