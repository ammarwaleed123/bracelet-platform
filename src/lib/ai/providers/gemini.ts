import "server-only";

import { GoogleGenAI } from "@google/genai";

import { env } from "@/lib/env";
import { AI } from "../config";
import { buildUserPrompt, SYSTEM_PROMPT } from "../prompts";
import { geminiResponseSchema } from "../schema";
import {
  AiExhaustedError,
  type CatalogContext,
  type DesignerInput,
  type RawGeneration,
} from "../types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retryable = rate limit (429) or a transient server hiccup (503 / overloaded).
 *  Both resolve to the same warm "try again shortly" state if they persist. */
function isRetryable(err: unknown): boolean {
  const e = err as { status?: number; code?: number; message?: string };
  const code = e?.status ?? e?.code;
  const msg = String(e?.message ?? "");
  return (
    code === 429 ||
    code === 503 ||
    /\b429\b|\b503\b|RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded|high demand|quota|rate.?limit|too many requests|try again/i.test(
      msg
    )
  );
}

/** A 429 tells us exactly how long to wait (e.g. `retryDelay:"4.24s"` or
 *  "Please retry in 4.24s"). Honour it so a momentary per-minute rate limit
 *  self-heals on the next try instead of surfacing the "taking a break" state. */
function serverRetryMs(err: unknown): number | null {
  const msg = String((err as { message?: string })?.message ?? "");
  const m =
    /"retryDelay"\s*:\s*"([\d.]+)s"/.exec(msg) ??
    /retry in ([\d.]+)\s*s/i.exec(msg);
  if (!m) return null;
  const secs = Number(m[1]);
  return Number.isFinite(secs) ? Math.ceil(secs * 1000) : null;
}

/** One call → all designs, as strict JSON. On a transient 429/503 it waits the
 *  server-requested delay (capped) — plus a small buffer — before retrying, and
 *  only throws AiExhaustedError once the limit genuinely persists. */
export async function generateWithGemini(
  input: DesignerInput,
  context: CatalogContext
): Promise<RawGeneration> {
  const ai = new GoogleGenAI({ apiKey: env.ai.geminiApiKey });
  const contents = buildUserPrompt(input, context);

  const maxAttempts = 4;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: AI.geminiModel,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: geminiResponseSchema,
          temperature: 0.8,
          // Composing from a list doesn't need extended reasoning; disabling the
          // thinking budget cuts latency from ~50s to a few seconds (and tokens).
          thinkingConfig: { thinkingBudget: 0 },
        },
      });
      return {
        text: res.text ?? "",
        promptTokens: res.usageMetadata?.promptTokenCount ?? undefined,
        totalTokens: res.usageMetadata?.totalTokenCount ?? undefined,
      };
    } catch (err) {
      if (isRetryable(err) && attempt < maxAttempts - 1) {
        // Prefer the delay the server asked for (+250ms buffer); fall back to
        // exponential backoff + jitter. Capped so a request never hangs long.
        const backoff = 800 * 2 ** attempt + Math.random() * 400;
        const server = serverRetryMs(err);
        await sleep(Math.min(10_000, Math.max(server ? server + 250 : 0, backoff)));
        continue;
      }
      if (isRetryable(err)) throw new AiExhaustedError();
      throw err;
    }
  }
  throw new AiExhaustedError();
}
