import "server-only";

import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { discountCodes } from "@/lib/db/schema";

export type DiscountResult =
  | {
      ok: true;
      codeId: string;
      code: string;
      discountInPiastres: number;
    }
  | { ok: false; error: string };

/**
 * Validate a discount code against a subtotal and return the piastres to
 * subtract. Server-authoritative — the client never computes the discount.
 * Caps the discount at the subtotal so a total can never go negative.
 */
export async function validateDiscountCode(
  rawCode: string,
  subtotalInPiastres: number
): Promise<DiscountResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a code." };

  const [row] = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.code, code))
    .limit(1);

  if (!row || !row.isActive) return { ok: false, error: "Invalid code." };
  if (row.expiresAt && row.expiresAt.getTime() < Date.now())
    return { ok: false, error: "This code has expired." };
  if (row.maxUses != null && row.usedCount >= row.maxUses)
    return { ok: false, error: "This code is no longer available." };
  if (subtotalInPiastres < row.minSubtotalInPiastres)
    return {
      ok: false,
      error: `Spend more to use this code (minimum applies).`,
    };

  const raw =
    row.type === "percent"
      ? Math.round((subtotalInPiastres * row.value) / 100)
      : row.value;
  const discountInPiastres = Math.max(0, Math.min(raw, subtotalInPiastres));

  return { ok: true, codeId: row.id, code: row.code, discountInPiastres };
}

/** Increment usage when an order that used the code is created. */
export async function incrementDiscountUse(codeId: string) {
  await db
    .update(discountCodes)
    .set({ usedCount: sql`${discountCodes.usedCount} + 1` })
    .where(eq(discountCodes.id, codeId));
}
