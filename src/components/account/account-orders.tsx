import Link from "next/link";

import { cn, formatPrice } from "@/lib/utils";
import { orderStatusLabel } from "@/lib/commerce/status";

type OrderRow = {
  orderNumber: string;
  status: string;
  totalInPiastres: number;
  placedAt: Date;
};

export function AccountOrders({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-12 text-center text-ink-soft">
        No orders yet. When you place one, it&apos;ll appear here.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {orders.map((o) => (
        <li key={o.orderNumber}>
          <Link
            href={`/orders/${o.orderNumber}/track`}
            className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-linen"
          >
            <div>
              <p className="font-medium text-ink">{o.orderNumber}</p>
              <p className="text-xs text-ink-soft">
                {new Date(o.placedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  o.status === "cancelled"
                    ? "bg-destructive/10 text-destructive"
                    : o.status === "delivered"
                      ? "bg-gold-tint text-gold-strong"
                      : "bg-sand text-ink"
                )}
              >
                {orderStatusLabel(o.status)}
              </span>
              <span className="tabular-nums text-sm text-ink">
                {formatPrice(o.totalInPiastres)}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
