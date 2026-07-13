import "server-only";

import { circumferenceMm } from "@/lib/studio/derive";
import type { StudioCatalog } from "@/lib/studio/types";
import { AI } from "./config";
import type { DesignConcept, GeneratedDesign } from "./types";

type Item = { diameterMm: number; priceInPiastres: number; stockQuantity: number };

type Part = { kind: "bead" | "charm"; refId: string; item: Item };

/**
 * Turn model output into designs we can trust: drop any component that isn't a
 * real, in-stock catalog item; enforce wrist capacity; enforce the budget from
 * OUR prices (never the model's) by dropping the priciest items; then, if a
 * design landed far under budget, top it up with more of its own beads so it
 * both fills the wrist and reaches at least `budgetFloorRatio` of the budget.
 * Repairs in place rather than re-requesting. A design is kept only if it still
 * holds at least `minComponents` and lands within budget.
 */
export function validateAndRepair(
  designs: GeneratedDesign[],
  catalog: StudioCatalog,
  budgetPiastres: number
): DesignConcept[] {
  const beadMap = new Map(catalog.beads.map((b) => [b.id, b] as const));
  const charmMap = new Map(catalog.charms.map((c) => [c.id, c] as const));
  const baseMap = new Map(catalog.bases.map((b) => [b.id, b] as const));
  const inStockBases = catalog.bases.filter((b) => b.stockQuantity > 0);
  const defaultBase = inStockBases[0] ?? catalog.bases[0] ?? null;
  const cheapestBase =
    [...inStockBases].sort((a, b) => a.priceInPiastres - b.priceInPiastres)[0] ??
    defaultBase;

  const floor = Math.round(budgetPiastres * AI.budgetFloorRatio);
  const concepts: DesignConcept[] = [];

  for (const d of designs) {
    // Base: keep if valid + in stock, else fall back to a default base.
    const chosen = d.baseId ? baseMap.get(d.baseId) : undefined;
    let baseId = (chosen && chosen.stockQuantity > 0 ? chosen : defaultBase)?.id ?? null;
    let basePrice = (chosen && chosen.stockQuantity > 0 ? chosen : defaultBase)?.priceInPiastres ?? 0;

    const sizeCm = Math.min(
      AI.maxSizeCm,
      Math.max(
        AI.minSizeCm,
        Number.isFinite(d.sizeCm) ? d.sizeCm : AI.defaultSizeCm
      )
    );
    const capacityMm = circumferenceMm(sizeCm);

    // Keep only real, in-stock components.
    const parts: Part[] = [];
    for (const c of d.components) {
      const item = c.kind === "bead" ? beadMap.get(c.refId) : charmMap.get(c.refId);
      if (item && item.stockQuantity > 0) {
        parts.push({ kind: c.kind, refId: c.refId, item });
      }
    }

    // Capacity: keep components while they still fit the wrist circumference.
    const fitted: Part[] = [];
    let usedMm = 0;
    for (const p of parts) {
      if (usedMm + p.item.diameterMm <= capacityMm) {
        fitted.push(p);
        usedMm += p.item.diameterMm;
      }
    }

    const sum = () => fitted.reduce((s, p) => s + p.item.priceInPiastres, 0);
    const dropPriciest = () => {
      let idx = 0;
      for (let i = 1; i < fitted.length; i++) {
        if (fitted[i]!.item.priceInPiastres > fitted[idx]!.item.priceInPiastres) {
          idx = i;
        }
      }
      fitted.splice(idx, 1);
    };

    // Budget: drop the most expensive component until base + parts ≤ budget.
    while (basePrice + sum() > budgetPiastres && fitted.length > 0) dropPriciest();
    // If the base alone still blows the budget, swap to the cheapest base before
    // giving up on it — a real bracelet keeps its cord/chain.
    if (basePrice + sum() > budgetPiastres && cheapestBase && cheapestBase.priceInPiastres < basePrice) {
      baseId = cheapestBase.id;
      basePrice = cheapestBase.priceInPiastres;
      while (basePrice + sum() > budgetPiastres && fitted.length > 0) dropPriciest();
    }
    if (basePrice + sum() > budgetPiastres) {
      baseId = null;
      basePrice = 0;
    }

    // Budget floor: if we're well under budget, string on more of this design's
    // own beads (cheapest first, cycling its palette) until we reach the floor —
    // this both fills the wrist and lifts the price toward what was asked for,
    // without introducing off-palette pieces. Bounded by capacity and budget.
    const beadPool = fitted
      .filter((p) => p.kind === "bead")
      .sort((a, b) => a.item.priceInPiastres - b.item.priceInPiastres);
    if (beadPool.length > 0) {
      usedMm = fitted.reduce((s, p) => s + p.item.diameterMm, 0);
      let guard = AI.maxComponents * 2;
      while (basePrice + sum() < floor && guard-- > 0) {
        const next = beadPool.find(
          (p) =>
            usedMm + p.item.diameterMm <= capacityMm &&
            basePrice + sum() + p.item.priceInPiastres <= budgetPiastres
        );
        if (!next) break;
        fitted.push({ kind: next.kind, refId: next.refId, item: next.item });
        usedMm += next.item.diameterMm;
      }
    }

    const total = basePrice + sum();
    if (fitted.length >= AI.minComponents && total <= budgetPiastres) {
      concepts.push({
        name: d.name.trim().slice(0, 60) || "Your bracelet",
        story: d.story.trim().slice(0, 300),
        baseId,
        sizeCm,
        components: fitted.map((p) => ({ kind: p.kind, refId: p.refId })),
        priceInPiastres: total,
      });
    }
  }

  return concepts;
}
