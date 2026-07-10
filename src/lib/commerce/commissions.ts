import "server-only";

import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  commissionEntries,
  designs,
  orderItems,
  orders,
  profiles,
  settings,
} from "@/lib/db/schema";

const COMMISSION_KEY = "commission_percent";
const DEFAULT_PERCENT = 10;

/** The current commission rate (percent of item price). */
export async function getCommissionPercent(): Promise<number> {
  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, COMMISSION_KEY))
    .limit(1);
  const n = row ? Number(row.value) : DEFAULT_PERCENT;
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : DEFAULT_PERCENT;
}

/** Admin sets the commission rate (0–100). */
export async function setCommissionPercent(percent: number) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  await db
    .insert(settings)
    .values({ key: COMMISSION_KEY, value: String(p) })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: String(p), updatedAt: new Date() },
    });
}

/**
 * Settle creator commissions for an order after any status/payment change.
 * Idempotent and reversible:
 *  - delivered + paid  → accrue each qualifying item once (credit the creator)
 *  - cancelled         → reverse any accrued entries once (debit the creator)
 * Qualifying items are those with a `creatorId` (exact purchase of someone
 * else's design — forks, brand designs and self-purchases have a null creator).
 */
export async function settleCommissions(orderId: string): Promise<void> {
  const [order] = await db
    .select({ status: orders.status, paymentStatus: orders.paymentStatus })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) return;

  const shouldAccrue =
    order.status === "delivered" && order.paymentStatus === "paid";
  const cancelled = order.status === "cancelled";
  if (!shouldAccrue && !cancelled) return;

  const percent = await getCommissionPercent();

  await db.transaction(async (tx) => {
    if (cancelled) {
      const entries = await tx
        .select()
        .from(commissionEntries)
        .where(
          and(
            eq(commissionEntries.orderId, orderId),
            eq(commissionEntries.status, "accrued")
          )
        );
      for (const e of entries) {
        await tx
          .update(commissionEntries)
          .set({ status: "reversed", updatedAt: new Date() })
          .where(eq(commissionEntries.id, e.id));
        await tx
          .update(profiles)
          .set({
            storeCreditInPiastres: sql`GREATEST(${profiles.storeCreditInPiastres} - ${e.amountInPiastres}, 0)`,
          })
          .where(eq(profiles.id, e.creatorId));
      }
      return;
    }

    // Accrue.
    const items = await tx
      .select({
        id: orderItems.id,
        creatorId: orderItems.creatorId,
        designId: orderItems.designId,
        unit: orderItems.unitPriceInPiastres,
        qty: orderItems.quantity,
      })
      .from(orderItems)
      .where(
        and(eq(orderItems.orderId, orderId), isNotNull(orderItems.creatorId))
      );

    for (const it of items) {
      if (!it.creatorId) continue;
      const amount = Math.round((it.unit * it.qty * percent) / 100);
      if (amount <= 0) continue;

      const [existing] = await tx
        .select({ id: commissionEntries.id, status: commissionEntries.status })
        .from(commissionEntries)
        .where(eq(commissionEntries.orderItemId, it.id))
        .limit(1);

      if (!existing) {
        await tx.insert(commissionEntries).values({
          orderId,
          orderItemId: it.id,
          creatorId: it.creatorId,
          designId: it.designId,
          amountInPiastres: amount,
          status: "accrued",
        });
        await tx
          .update(profiles)
          .set({
            storeCreditInPiastres: sql`${profiles.storeCreditInPiastres} + ${amount}`,
          })
          .where(eq(profiles.id, it.creatorId));
      } else if (existing.status === "reversed") {
        // Order returned to delivered+paid after a cancellation — re-accrue.
        await tx
          .update(commissionEntries)
          .set({ status: "accrued", amountInPiastres: amount, updatedAt: new Date() })
          .where(eq(commissionEntries.id, existing.id));
        await tx
          .update(profiles)
          .set({
            storeCreditInPiastres: sql`${profiles.storeCreditInPiastres} + ${amount}`,
          })
          .where(eq(profiles.id, it.creatorId));
      }
      // existing 'accrued' → already credited, do nothing (idempotent).
    }
  });
}

export type CreatorEarning = {
  id: string;
  amountInPiastres: number;
  status: "accrued" | "reversed";
  designName: string | null;
  createdAt: Date;
};

/** A creator's commission history for their account page. */
export async function getCreatorEarnings(
  userId: string
): Promise<CreatorEarning[]> {
  return db
    .select({
      id: commissionEntries.id,
      amountInPiastres: commissionEntries.amountInPiastres,
      status: commissionEntries.status,
      designName: designs.name,
      createdAt: commissionEntries.createdAt,
    })
    .from(commissionEntries)
    .leftJoin(designs, eq(commissionEntries.designId, designs.id))
    .where(eq(commissionEntries.creatorId, userId))
    .orderBy(desc(commissionEntries.createdAt));
}
