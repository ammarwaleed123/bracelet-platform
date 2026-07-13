import "server-only";

import { circumferenceMm } from "@/lib/studio/derive";
import type { StudioCatalog } from "@/lib/studio/types";
import { AI } from "./config";
import type { DesignConcept, GeneratedDesign } from "./types";

type Item = { diameterMm: number; priceInPiastres: number; stockQuantity: number };

/**
 * Turn model output into designs we can trust: drop any component that isn't a
 * real, in-stock catalog item; enforce wrist capacity; and enforce the budget
 * from OUR prices (never the model's) by dropping the priciest items. Repairs in
 * place rather than re-requesting. A design is kept only if it still holds at
 * least `minComponents` and lands within budget.
 */
export function validateAndRepair(
  designs: GeneratedDesign[],
  catalog: StudioCatalog,
  budgetPiastres: number
): DesignConcept[] {
  const beadMap = new Map(catalog.beads.map((b) => [b.id, b] as const));
  const charmMap = new Map(catalog.charms.map((c) => [c.id, c] as const));
  const baseMap = new Map(catalog.bases.map((b) => [b.id, b] as const));
  const defaultBase =
    catalog.bases.find((b) => b.stockQuantity > 0) ?? catalog.bases[0] ?? null;

  const concepts: DesignConcept[] = [];

  for (const d of designs) {
    // Base: keep if valid + in stock, else fall back to a default base.
    const chosen = d.baseId ? baseMap.get(d.baseId) : undefined;
    const base = chosen && chosen.stockQuantity > 0 ? chosen : defaultBase;
    let baseId = base?.id ?? null;
    let basePrice = base?.priceInPiastres ?? 0;

    const sizeCm = Math.min(
      AI.maxSizeCm,
      Math.max(
        AI.minSizeCm,
        Number.isFinite(d.sizeCm) ? d.sizeCm : AI.defaultSizeCm
      )
    );
    const capacityMm = circumferenceMm(sizeCm);

    // Keep only real, in-stock components.
    const parts: { kind: "bead" | "charm"; refId: string; item: Item }[] = [];
    for (const c of d.components) {
      const item = c.kind === "bead" ? beadMap.get(c.refId) : charmMap.get(c.refId);
      if (item && item.stockQuantity > 0) {
        parts.push({ kind: c.kind, refId: c.refId, item });
      }
    }

    // Capacity: keep components while they still fit the wrist circumference.
    const fitted: typeof parts = [];
    let usedMm = 0;
    for (const p of parts) {
      if (usedMm + p.item.diameterMm <= capacityMm) {
        fitted.push(p);
        usedMm += p.item.diameterMm;
      }
    }

    // Budget: drop the most expensive component until base + parts ≤ budget.
    const sum = () => fitted.reduce((s, p) => s + p.item.priceInPiastres, 0);
    while (basePrice + sum() > budgetPiastres && fitted.length > 0) {
      let idx = 0;
      for (let i = 1; i < fitted.length; i++) {
        if (fitted[i]!.item.priceInPiastres > fitted[idx]!.item.priceInPiastres) {
          idx = i;
        }
      }
      fitted.splice(idx, 1);
    }
    // If the base alone still blows the budget, drop the base.
    if (basePrice + sum() > budgetPiastres && base) {
      baseId = null;
      basePrice = 0;
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
