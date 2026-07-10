"use server";

import { getOrderForTracking } from "@/lib/commerce/orders-query";
import type { Order, OrderItem, OrderEvent } from "@/lib/db/schema";

export type TrackResult =
  | { ok: true; order: Order; items: OrderItem[]; events: OrderEvent[] }
  | { ok: false; error: string };

/** Guest tracking: returns the order only when the phone matches. */
export async function trackOrder(
  orderNumber: string,
  phone: string
): Promise<TrackResult> {
  const result = await getOrderForTracking(orderNumber, phone);
  if (!result) {
    return {
      ok: false,
      error: "No order found with that number and phone. Please check both.",
    };
  }
  return { ok: true, ...result };
}
