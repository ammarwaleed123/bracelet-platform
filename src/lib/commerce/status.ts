/** Human-facing labels + ordering for order statuses (shared by all views). */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_confirmation: "Pending confirmation",
  confirmed: "Confirmed",
  crafting: "Crafting",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** The happy-path progression shown in the tracking timeline. */
export const ORDER_STATUS_FLOW = [
  "pending_confirmation",
  "confirmed",
  "crafting",
  "shipped",
  "delivered",
] as const;

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}
