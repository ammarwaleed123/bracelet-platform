import "server-only";

import type {
  CatalogContext,
  DesignerInput,
  RawGeneration,
} from "../types";

/**
 * Stub provider — same interface as Gemini. Selected via AI_PROVIDER=anthropic.
 * Left unimplemented on purpose: switching to it is an env change, not a refactor.
 * See docs/AI-PROVIDER-SWITCH.md for the migration steps.
 */
export async function generateWithAnthropic(
  _input: DesignerInput,
  _context: CatalogContext
): Promise<RawGeneration> {
  throw new Error(
    "Anthropic provider is not configured. Set ANTHROPIC_API_KEY and AI_PROVIDER=anthropic, then implement generateWithAnthropic — see docs/AI-PROVIDER-SWITCH.md."
  );
}
