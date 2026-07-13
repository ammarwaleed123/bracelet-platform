/**
 * The heart of the AI designer — kept in its own file so it's easy to read and
 * tune. The system prompt sets the brand + design rules; the user prompt carries
 * the customer's answers and the real catalog the model must build from.
 */
import { AI } from "./config";
import type { CatalogContext, DesignerInput } from "./types";

const egp = (piastres: number) => (piastres / 100).toLocaleString("en-US");

export const SYSTEM_PROMPT = `You are the master jewelry designer for Aurelia, a premium made-to-order bracelet studio in Egypt. You compose bracelets ONLY from the catalog of real, in-stock components provided in the user's message, each referenced by its exact id. Never invent ids or components.

Design principles — follow all of them:
- Colour harmony: choose beads whose colours form one intentional, elegant palette (harmonious, or tastefully contrasting) — never a random rainbow.
- Meaning coherence: favour stones whose meanings resonate with what the customer says matters to them.
- Three DISTINCT concepts: the ${AI.designCount} designs must feel meaningfully different from one another — different palettes, moods and structure — not shuffles of the same beads.
- Budget is a target, not just a ceiling. The TOTAL price of each design (base + every component, in EGP) MUST NOT exceed the customer's budget, and SHOULD land close to it — aim for ${Math.round(
    AI.budgetTargetRatio * 100
  )}–100% of the budget, and never below ${Math.round(
    AI.budgetFloorRatio * 100
  )}%. For a generous budget, reach it with finer, higher-value stones and an extra charm or two — do not leave most of the budget unspent.
- Vary the FULLNESS across the three designs so they look different on the wrist:
  • Make at least ONE a FULL bracelet — beads strung all the way around the wrist. A full ~18cm bracelet needs roughly 18–${AI.maxComponents} beads (their diameters in mm add up to about the wrist size in cm × 10).
  • Make at least ONE a LIGHTER, half-strung design — a smaller cluster of ${AI.minComponents}–8 focal pieces, leaving the base visible.
  • The third can sit in between.
  Reach the budget on a lighter design by choosing more precious stones, not by padding it.
- Voice: write each design's name (2–4 words) and story (1–2 sentences) in Aurelia's voice — warm, elegant, personal and specific to the actual choices. Never generic marketing.

Return ONLY valid JSON matching the required schema: exactly ${AI.designCount} designs, each with a baseId, a sizeCm, and an ordered components list referencing catalog ids.`;

/** Build the per-request user prompt from the customer answers + catalog. */
export function buildUserPrompt(
  input: DesignerInput,
  context: CatalogContext
): string {
  const answers = [
    input.occasion && `Occasion: ${input.occasion}`,
    input.forWhom && `For: ${input.forWhom}`,
    input.vibe && `Style / vibe: ${input.vibe}`,
    input.colors.length && `Favourite colours: ${input.colors.join(", ")}`,
    input.values.length &&
      `What matters to them: ${input.values.join(", ")}`,
    `Budget: up to EGP ${egp(input.budgetPiastres)} total per bracelet`,
  ]
    .filter(Boolean)
    .join("\n");

  const bases = context.bases
    .map(
      (b) =>
        `${b.id} | ${b.name} | ${b.type} | ${b.colorHex} | EGP ${egp(b.priceInPiastres)}`
    )
    .join("\n");
  const beads = context.beads
    .map(
      (b) =>
        `${b.id} | ${b.name} | stone:${b.stone ?? "-"} | meaning:${b.meaning ?? "-"} | ${b.colorHex} | ${b.finish} | ${b.diameterMm}mm | EGP ${egp(b.priceInPiastres)}`
    )
    .join("\n");
  const charms = context.charms
    .map(
      (c) =>
        `${c.id} | ${c.name} | meaning:${c.meaning ?? "-"} | ${c.colorHex} | ${c.diameterMm}mm | EGP ${egp(c.priceInPiastres)}`
    )
    .join("\n");

  return `Customer answers:
${answers}

CATALOG — use these exact ids only. Format: id | name | details… | price.

BASES (pick exactly one per design):
${bases}

BEADS:
${beads}

CHARMS:
${charms}

Compose ${AI.designCount} distinct bracelets using only ids from the lists above. Use sizeCm between ${AI.minSizeCm} and ${AI.maxSizeCm} (default ${AI.defaultSizeCm}). Each total (base + all components) must be ≤ EGP ${egp(
    input.budgetPiastres
  )} and ideally ≥ EGP ${egp(
    Math.round(input.budgetPiastres * AI.budgetTargetRatio)
  )}. Vary the fullness: at least one full bracelet (beads all the way around) and at least one lighter, half-strung design.`;
}
