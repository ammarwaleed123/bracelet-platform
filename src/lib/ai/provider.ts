import "server-only";

import { env } from "@/lib/env";
import { AI } from "./config";
import { generatedDesignsSchema } from "./schema";
import { generateWithGemini } from "./providers/gemini";
import { generateWithAnthropic } from "./providers/anthropic";
import type { CatalogContext, DesignerInput, GeneratedDesign } from "./types";

export type ProviderResponse = {
  designs: GeneratedDesign[];
  provider: "gemini" | "anthropic";
  model: string;
  promptTokens?: number;
  totalTokens?: number;
};

/**
 * The single provider abstraction: one call to the active provider returns all
 * designs, parsed into structurally-valid shapes (catalog validation happens
 * next, in validateAndRepair). Throws on quota exhaustion or unparseable output.
 */
export async function generateBracelets(
  input: DesignerInput,
  context: CatalogContext
): Promise<ProviderResponse> {
  const anthropic = env.ai.provider === "anthropic";
  const raw = anthropic
    ? await generateWithAnthropic(input, context)
    : await generateWithGemini(input, context);

  const parsed = generatedDesignsSchema.parse(JSON.parse(raw.text));
  return {
    designs: parsed.designs,
    provider: anthropic ? "anthropic" : "gemini",
    model: anthropic ? AI.anthropicModel : AI.geminiModel,
    promptTokens: raw.promptTokens,
    totalTokens: raw.totalTokens,
  };
}
