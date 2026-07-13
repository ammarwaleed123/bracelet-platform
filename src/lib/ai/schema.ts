import { Type, type Schema } from "@google/genai";
import { z } from "zod";

import { AI } from "./config";

/* ----------------------------- input (client → server) ------------------- */

export const designerInputSchema = z.object({
  occasion: z.string().trim().max(60).optional(),
  forWhom: z.string().trim().max(60).optional(),
  vibe: z.string().trim().max(60).optional(),
  colors: z.array(z.string().trim().max(30)).max(12).default([]),
  values: z.array(z.string().trim().max(40)).max(12).default([]),
  // 50 EGP … 20,000 EGP, in piastres.
  budgetPiastres: z.number().int().min(5_000).max(2_000_000),
});

/* ---------------------------- output (model → server) -------------------- */

export const generatedDesignsSchema = z.object({
  designs: z
    .array(
      z.object({
        name: z.string().min(1).max(80),
        story: z.string().min(1).max(400),
        baseId: z.string().min(1),
        sizeCm: z.number(),
        components: z
          .array(
            z.object({
              kind: z.enum(["bead", "charm"]),
              refId: z.string().min(1),
            })
          )
          .max(80),
      })
    )
    .min(1),
});

/** Gemini structured-output schema — kept in sync with `generatedDesignsSchema`. */
export const geminiResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    designs: {
      type: Type.ARRAY,
      minItems: String(AI.designCount),
      maxItems: String(AI.designCount),
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          story: { type: Type.STRING },
          baseId: { type: Type.STRING },
          sizeCm: { type: Type.NUMBER },
          components: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                kind: { type: Type.STRING, enum: ["bead", "charm"] },
                refId: { type: Type.STRING },
              },
              required: ["kind", "refId"],
            },
          },
        },
        required: ["name", "story", "baseId", "sizeCm", "components"],
      },
    },
  },
  required: ["designs"],
};
