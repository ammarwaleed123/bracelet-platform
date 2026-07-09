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
  colorHex: string;
  diameterMm: number;
  priceInPiastres: number;
  stockQuantity: number;
  finish: StudioBead["finish"];
  charmShape?: StudioCharm["charmShape"];
  letterValue?: string | null;
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
      colorHex: b.colorHex,
      diameterMm: b.diameterMm,
      priceInPiastres: b.priceInPiastres,
      stockQuantity: b.stockQuantity,
      finish: b.finish,
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
    colorHex: c.colorHex,
    diameterMm: c.diameterMm,
    priceInPiastres: c.priceInPiastres,
    stockQuantity: c.stockQuantity,
    finish: "metallic",
    charmShape: c.charmShape,
    letterValue: c.letterValue,
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

/* ----- Layout: even angular distribution around the wrist ring --------- */
/* Scene units are centimeters. Components are spread evenly around a ring
   whose circumference equals the wrist size, starting at the top (12 o'clock)
   and going clockwise. */

export function ringRadiusUnits(sizeCm: number): number {
  return sizeCm / (2 * Math.PI);
}

/** Position [x, y, z] (in cm units, XY plane) for slot `i` of `count`. */
export function slotPosition(
  sizeCm: number,
  i: number,
  count: number
): [number, number, number] {
  const r = ringRadiusUnits(sizeCm);
  if (count === 0) return [0, r, 0];
  const angle = Math.PI / 2 - (i / count) * Math.PI * 2; // top, clockwise
  return [Math.cos(angle) * r, Math.sin(angle) * r, 0];
}

/** Bead/charm radius in scene units (mm diameter → cm radius). */
export function componentRadiusUnits(diameterMm: number): number {
  return diameterMm / 20;
}
