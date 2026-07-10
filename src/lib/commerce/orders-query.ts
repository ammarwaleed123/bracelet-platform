import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { orderEvents, orderItems, orders } from "@/lib/db/schema";

export async function getOrderByNumber(orderNumber: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  const events = await db
    .select()
    .from(orderEvents)
    .where(eq(orderEvents.orderId, order.id))
    .orderBy(asc(orderEvents.createdAt));

  return { order, items, events };
}

/** Guest-safe tracking: only returns the order if the phone matches. */
export async function getOrderForTracking(orderNumber: string, phone: string) {
  const result = await getOrderByNumber(orderNumber);
  if (!result) return null;
  if (result.order.customerPhone !== phone.trim()) return null;
  return result;
}

/** All orders for the admin list, newest first. */
export async function getAllOrders() {
  return db
    .select({
      orderNumber: orders.orderNumber,
      customerName: orders.customerName,
      governorate: orders.governorate,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalInPiastres: orders.totalInPiastres,
      placedAt: orders.placedAt,
    })
    .from(orders)
    .orderBy(desc(orders.placedAt));
}

/** Orders for a logged-in user's account, newest first. */
export async function getUserOrders(userId: string) {
  return db
    .select({
      orderNumber: orders.orderNumber,
      status: orders.status,
      totalInPiastres: orders.totalInPiastres,
      placedAt: orders.placedAt,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.placedAt));
}
