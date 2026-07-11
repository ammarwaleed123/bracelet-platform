import type {
  PlacedComponent,
  StudioBase,
  StudioBead,
  StudioCatalog,
  StudioCharm,
} from "@/lib/studio/types";

/** Fast id → item lookups built once from the catalog. */
export type CatalogIndex = {
  bases: Map<string, StudioBase>;
  beads: Map<string, StudioBead>;
  charms: Map<string, StudioCharm>;
};

export function indexCatalog(catalog: StudioCatalog): CatalogIndex {
  return {
    bases: new Map(catalog.bases.map((b) => [b.id, b])),
    beads: new Map(catalog.beads.map((b) => [b.id, b])),
    charms: new Map(catalog.charms.map((c) => [c.id, c])),
  };
}

/** A placed component joined to its catalog data, ready to render/price. */
export type ResolvedComponent = {
  uid: string;
  kind: "bead" | "charm";
  refId: string;
  name: string;
  meaning: string | null;
  colorHex: string;
  diameterMm: number;
  priceInPiastres: number;
  stockQuantity: number;
  finish: StudioBead["finish"];
  charmShape?: StudioCharm["charmShape"];
  letterValue?: string | null;
  imageUrl: string | null;
  material: StudioBead["material3dParams"];
};

export function resolveComponent(
  index: CatalogIndex,
  comp: PlacedComponent
): ResolvedComponent | null {
  if (comp.kind === "bead") {
    const b = index.beads.get(comp.refId);
    if (!b) return null;
    return {
      uid: comp.uid,
      kind: "bead",
      refId: comp.refId,
      name: b.name,
      meaning: b.meaning,
      colorHex: b.colorHex,
      diameterMm: b.diameterMm,
      priceInPiastres: b.priceInPiastres,
      stockQuantity: b.stockQuantity,
      finish: b.finish,
      imageUrl: b.imageUrl,
      material: b.material3dParams,
    };
  }
  const c = index.charms.get(comp.refId);
  if (!c) return null;
  return {
    uid: comp.uid,
    kind: "charm",
    refId: comp.refId,
    name: c.name,
    meaning: c.meaning,
    colorHex: c.colorHex,
    diameterMm: c.diameterMm,
    priceInPiastres: c.priceInPiastres,
    stockQuantity: c.stockQuantity,
    finish: "metallic",
    charmShape: c.charmShape,
    letterValue: c.letterValue,
    imageUrl: c.imageUrl,
    material: c.material3dParams,
  };
}

export function resolveComponents(
  index: CatalogIndex,
  components: PlacedComponent[]
): ResolvedComponent[] {
  return components
    .map((c) => resolveComponent(index, c))
    .filter((c): c is ResolvedComponent => c !== null);
}

/** Authoritative-shaped client estimate: base + sum of component prices. */
export function computePriceInPiastres(
  index: CatalogIndex,
  baseId: string | null,
  components: PlacedComponent[]
): number {
  const base = baseId ? index.bases.get(baseId) : undefined;
  const basePrice = base?.priceInPiastres ?? 0;
  const parts = resolveComponents(index, components).reduce(
    (sum, c) => sum + c.priceInPiastres,
    0
  );
  return basePrice + parts;
}

/* ----- Capacity: components occupy their diameter along the wrist ------- */

/** Inner circumference of the bracelet in mm (wrist size in cm × 10). */
export function circumferenceMm(sizeCm: number): number {
  return sizeCm * 10;
}

export function usedLengthMm(
  index: CatalogIndex,
  components: PlacedComponent[]
): number {
  return resolveComponents(index, components).reduce(
    (sum, c) => sum + c.diameterMm,
    0
  );
}

/** Whether a component of the given diameter still fits on the bracelet. */
export function fits(
  index: CatalogIndex,
  sizeCm: number,
  components: PlacedComponent[],
  nextDiameterMm: number
): boolean {
  return usedLengthMm(index, components) + nextDiameterMm <= circumferenceMm(sizeCm);
}

/* ----- Layout: beads strung touching, lying flat in the XZ plane -------- */
/* Scene units are centimeters. Components are packed edge-to-edge around a
   ring (like a real strung bracelet) starting at the back and going clockwise;
   the ring lies flat (y = 0) so it reads as a photographed flat-lay. */

export type LayoutItem = {
  angle: number;
  position: [number, number, number];
};

export type BraceletLayout = {
  radiusUnits: number;
  items: LayoutItem[];
};

/** Compute ring radius + each component's flat-lay position from diameters. */
export function computeLayout(
  diametersMm: number[],
  sizeCm: number
): BraceletLayout {
  const diamsCm = diametersMm.map((d) => d / 10);
  const sumLen = diamsCm.reduce((a, b) => a + b, 0);
  // The ring is at least the wrist size; beads never overlap.
  const circumference = Math.max(sumLen, sizeCm);
  const radius = circumference / (2 * Math.PI);

  let cursor = 0;
  const items = diamsCm.map((d) => {
    const center = cursor + d / 2;
    cursor += d;
    const angle = Math.PI / 2 - (center / circumference) * Math.PI * 2;
    return {
      angle,
      position: [
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius,
      ] as [number, number, number],
    };
  });

  return { radiusUnits: radius, items };
}

/** Index of the slot whose center is angularly nearest to `angle`. */
export function nearestSlotIndex(items: LayoutItem[], angle: number): number {
  let best = 0;
  let bestDelta = Infinity;
  items.forEach((item, i) => {
    let delta = Math.abs(item.angle - angle);
    delta = Math.min(delta, Math.PI * 2 - delta); // circular distance
    if (delta < bestDelta) {
      bestDelta = delta;
      best = i;
    }
  });
  return best;
}

/** Bead/charm radius in scene units (mm diameter → cm radius). */
export function componentRadiusUnits(diameterMm: number): number {
  return diameterMm / 20;
}
