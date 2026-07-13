/** Shared types for the AI Bracelet Designer. */

/** The customer's guided answers. Everything optional except the budget. */
export type DesignerInput = {
  occasion?: string;
  forWhom?: string;
  vibe?: string;
  colors: string[];
  /** "What matters to them" — maps to stone meanings. */
  values: string[];
  budgetPiastres: number;
};

/** Lean, in-stock catalog passed to the model (no image URLs / timestamps). */
export type CatalogContext = {
  bases: {
    id: string;
    name: string;
    type: string;
    colorHex: string;
    priceInPiastres: number;
  }[];
  beads: {
    id: string;
    name: string;
    stone: string | null;
    meaning: string | null;
    colorHex: string;
    finish: string;
    diameterMm: number;
    priceInPiastres: number;
  }[];
  charms: {
    id: string;
    name: string;
    meaning: string | null;
    colorHex: string;
    diameterMm: number;
    priceInPiastres: number;
  }[];
};

/** Raw provider output before parsing/validation. */
export type RawGeneration = {
  text: string;
  promptTokens?: number;
  totalTokens?: number;
};

/** A design as returned by the model — refIds point into the catalog. */
export type GeneratedDesign = {
  name: string;
  story: string;
  baseId: string | null;
  sizeCm: number;
  components: { kind: "bead" | "charm"; refId: string }[];
};

/** A validated, repaired design ready for the client (with OUR computed price). */
export type DesignConcept = GeneratedDesign & { priceInPiastres: number };

export type GenerateError =
  | "disabled"
  | "auth"
  | "rate_limited"
  | "exhausted"
  | "failed";

export type GenerateResult =
  | { ok: true; concepts: DesignConcept[] }
  | { ok: false; error: GenerateError };

/** Thrown by a provider when its quota is exhausted (429 after retries). */
export class AiExhaustedError extends Error {
  constructor(message = "AI provider quota exhausted") {
    super(message);
    this.name = "AiExhaustedError";
  }
}
