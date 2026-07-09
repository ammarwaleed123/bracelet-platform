import type { Material3dParams, Model3dParams } from "@/lib/db/schema";

/**
 * Lightweight, client-safe catalog shapes for the studio. Numeric fields are
 * real numbers (diameter converted from the DB's numeric string), and only the
 * fields the 3D scene + palette need are included.
 */

export type StudioCategory = {
  id: string;
  name: string;
  slug: string;
};

export type StudioBase = {
  id: string;
  name: string;
  slug: string;
  type: "chain" | "cord" | "bangle";
  colorHex: string;
  priceInPiastres: number;
  stockQuantity: number;
  imageUrl: string | null;
  model3dParams: Model3dParams | null;
};

export type StudioBead = {
  id: string;
  name: string;
  slug: string;
  stoneType: string | null;
  meaning: string | null;
  colorHex: string;
  finish: "polished" | "matte" | "faceted" | "metallic";
  diameterMm: number;
  priceInPiastres: number;
  stockQuantity: number;
  imageUrl: string | null;
  material3dParams: Material3dParams | null;
  categoryIds: string[];
};

export type StudioCharm = {
  id: string;
  name: string;
  slug: string;
  meaning: string | null;
  colorHex: string;
  charmShape: "heart" | "star" | "moon" | "letter" | "custom";
  letterValue: string | null;
  diameterMm: number;
  priceInPiastres: number;
  stockQuantity: number;
  imageUrl: string | null;
  material3dParams: Material3dParams | null;
  categoryIds: string[];
};

export type StudioCatalog = {
  bases: StudioBase[];
  beads: StudioBead[];
  charms: StudioCharm[];
  categories: StudioCategory[];
};

/** A single placed component in the working design. */
export type PlacedComponent = {
  /** Unique per placement (so duplicates of the same bead are distinct). */
  uid: string;
  kind: "bead" | "charm";
  refId: string;
};

/** The serializable studio design state (also the localStorage draft shape). */
export type StudioDesignState = {
  baseId: string | null;
  sizeCm: number;
  components: PlacedComponent[];
};
