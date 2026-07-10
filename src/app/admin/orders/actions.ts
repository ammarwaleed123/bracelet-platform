"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  bases,
  beads,
  charms,
  orderEvents,
  orderItems,
  orders,
} from "@/lib/db/schema";
import type { DesignComponent, OrderItemDesignSnapshot } from "@/lib/db/schema";

const STATUSES = [
  "pending_confirmation",
  "confirmed",
  "crafting",
  "shipped",
  "delivered",
  "cancelled",
] as const;
type OrderStatusValue = (typeof STATUSES)[number];

/** Advance (or cancel) an order; records a tracking event. Cancelling an order
 *  that had reserved stock restores it. */
export async function setOrderStatus(
  orderNumber: string,
  status: OrderStatusValue,
  note?: string
) {
  await requireAdmin();
  if (!STATUSES.includes(status)) return;

  const [order] = await db
    .select({ id: orders.id, status: orders.status })
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!order || order.status === status) return;

  await db.transaction(async (tx) => {
    // Restore component stock when cancelling a not-already-cancelled order.
    if (status === "cancelled" && order.status !== "cancelled") {
      const items = await tx
        .select({ snapshot: orderItems.designSnapshotJson, quantity: orderItems.quantity })
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id));
      for (const it of items) {
        const snap = it.snapshot as OrderItemDesignSnapshot;
        if (snap.baseId) {
          await tx
            .update(bases)
            .set({ stockQuantity: sql`${bases.stockQuantity} + ${it.quantity}` })
            .where(eq(bases.id, snap.baseId));
        }
        for (const c of snap.components as DesignComponent[]) {
          const table = c.kind === "bead" ? beads : charms;
          await tx
            .update(table)
            .set({ stockQuantity: sql`${table.stockQuantity} + ${it.quantity}` })
            .where(eq(table.id, c.refId));
        }
      }
    }

    await tx
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    await tx.insert(orderEvents).values({
      orderId: order.id,
      status,
      note: note?.trim() || null,
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath(`/orders/${orderNumber}/track`);
  revalidatePath("/account");
}

/** Mark a COD order paid (cash collected). */
export async function markOrderPaid(orderNumber: string) {
  await requireAdmin();
  await db
    .update(orders)
    .set({ paymentStatus: "paid", updatedAt: new Date() })
    .where(eq(orders.orderNumber, orderNumber));
  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath("/admin/orders");
}
