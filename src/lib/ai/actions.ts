"use server";

import { and, count, eq, gte } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { aiGenerations } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { AI } from "./config";
import { loadCatalogContext } from "./catalog-context";
import { generateBracelets } from "./provider";
import { designerInputSchema } from "./schema";
import { validateAndRepair } from "./validate";
import { AiExhaustedError, type GenerateResult } from "./types";

const FEATURE_ON = process.env.NEXT_PUBLIC_FEATURE_AI_DESIGNER === "1";

/**
 * Generate 3 bracelet designs from the guided answers. Sign-in required;
 * rate-limited per user; every attempt is logged to ai_generations (which also
 * powers the admin usage panel + upgrade banner). Never throws to the client —
 * returns a typed error the UI renders as a friendly state.
 */
export async function generateDesigns(
  rawInput: unknown
): Promise<GenerateResult> {
  if (!FEATURE_ON) return { ok: false, error: "disabled" };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "auth" };

  const parsed = designerInputSchema.safeParse(rawInput);
  if (!parsed.success) return { ok: false, error: "failed" };
  const input = parsed.data;

  // Per-user rate limit: N generations per rolling hour.
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const [row] = await db
    .select({ n: count() })
    .from(aiGenerations)
    .where(
      and(eq(aiGenerations.userId, user.id), gte(aiGenerations.createdAt, since))
    );
  if ((row?.n ?? 0) >= AI.rateLimitPerHour) {
    return { ok: false, error: "rate_limited" };
  }

  const { catalog, context } = await loadCatalogContext();

  let provider: "gemini" | "anthropic" = env.ai.provider;
  let model: string = provider === "anthropic" ? AI.anthropicModel : AI.geminiModel;
  let promptTokens: number | undefined;
  let totalTokens: number | undefined;

  const log = (success: boolean, designCount: number, errorCode?: string) =>
    db.insert(aiGenerations).values({
      userId: user.id,
      provider,
      model,
      inputJson: input as Record<string, unknown>,
      success,
      designCount,
      promptTokens: promptTokens ?? null,
      totalTokens: totalTokens ?? null,
      errorCode: errorCode ?? null,
    });

  try {
    // Repair rather than refetch; retry the whole call at most once if every
    // design comes back unusable.
    for (let attempt = 0; attempt < 2; attempt++) {
      const resp = await generateBracelets(input, context);
      provider = resp.provider;
      model = resp.model;
      promptTokens = resp.promptTokens;
      totalTokens = resp.totalTokens;
      const concepts = validateAndRepair(
        resp.designs,
        catalog,
        input.budgetPiastres
      );
      if (concepts.length > 0) {
        await log(true, concepts.length);
        return { ok: true, concepts };
      }
    }
    await log(false, 0, "no_valid");
    return { ok: false, error: "failed" };
  } catch (err) {
    if (err instanceof AiExhaustedError) {
      await log(false, 0, "exhausted");
      return { ok: false, error: "exhausted" };
    }
    await log(false, 0, "failed");
    return { ok: false, error: "failed" };
  }
}
