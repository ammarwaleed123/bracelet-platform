import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { orders, profiles } from "@/lib/db/schema";

/**
 * Refund store credit spent on an order back to the buyer's balance when the
 * order is cancelled. Idempotent: the refund flag (`store_credit_refunded_at`)
 * is set atomically, so calling this repeatedly never double-refunds.
 */
export async function settleStoreCredit(orderId: string): Promise<void> {
  const [order] = await db
    .select({
      status: orders.status,
      applied: orders.storeCreditAppliedInPiastres,
      refundedAt: orders.storeCreditRefundedAt,
      userId: orders.userId,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) return;
  if (order.status !== "cancelled") return;
  if (!order.userId || order.applied <= 0 || order.refundedAt) return;

  await db.transaction(async (tx) => {
    // Claim the refund atomically — only proceeds if not already refunded.
    const claimed = await tx
      .update(orders)
      .set({ storeCreditRefundedAt: new Date() })
      .where(
        and(eq(orders.id, orderId), isNull(orders.storeCreditRefundedAt))
      )
      .returning({ id: orders.id });
    if (claimed.length === 0) return; // someone else refunded concurrently

    await tx
      .update(profiles)
      .set({
        storeCreditInPiastres: sql`${profiles.storeCreditInPiastres} + ${order.applied}`,
      })
      .where(eq(profiles.id, order.userId!));
  });
}
