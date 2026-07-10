import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Order, OrderItem, OrderEvent } from "@/lib/db/schema";
import {
  ORDER_STATUS_FLOW,
  orderStatusLabel,
} from "@/lib/commerce/status";
import { OrderItemsList, OrderTotals } from "./order-detail";

export function OrderTracker({
  order,
  items,
  events,
}: {
  order: Order;
  items: OrderItem[];
  events: OrderEvent[];
}) {
  const cancelled = order.status === "cancelled";
  const currentIndex = ORDER_STATUS_FLOW.indexOf(
    order.status as (typeof ORDER_STATUS_FLOW)[number]
  );

  const addr = order.shippingAddressJson;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label-caps">Order</p>
          <p className="font-serif text-2xl text-ink">{order.orderNumber}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium",
            cancelled
              ? "bg-destructive/10 text-destructive"
              : "bg-gold-tint text-gold-strong"
          )}
        >
          {orderStatusLabel(order.status)}
        </span>
      </div>

      {/* Timeline */}
      {cancelled ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          This order was cancelled.
        </p>
      ) : (
        <ol className="space-y-4">
          {ORDER_STATUS_FLOW.map((status, i) => {
            const done = i <= currentIndex;
            const event = [...events].reverse().find((e) => e.status === status);
            return (
              <li key={status} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                    done
                      ? "border-gold bg-gold text-cream"
                      : "border-border bg-card text-transparent"
                  )}
                >
                  <Check className="size-3.5" aria-hidden />
                </span>
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      done ? "text-ink" : "text-ink-soft"
                    )}
                  >
                    {orderStatusLabel(status)}
                  </p>
                  {event && (
                    <p className="text-xs text-ink-soft">
                      {new Date(event.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {event.note ? ` · ${event.note}` : ""}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Items + totals */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <OrderItemsList items={items} />
        <OrderTotals order={order} />
      </div>

      {/* Delivery details */}
      <div className="rounded-2xl border border-border bg-card p-6 text-sm">
        <h2 className="label-caps mb-3">Delivery</h2>
        <p className="text-ink">{order.customerName}</p>
        <p className="text-ink-soft">{order.customerPhone}</p>
        <p className="mt-2 text-ink-soft">
          {[addr.line1, addr.line2, addr.area, order.governorate]
            .filter(Boolean)
            .join(", ")}
          {addr.landmark ? ` (near ${addr.landmark})` : ""}
        </p>
        {addr.geo && (
          <a
            href={`https://www.google.com/maps?q=${addr.geo.lat},${addr.geo.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-gold-strong underline underline-offset-2"
          >
            View pinned location on map
          </a>
        )}
        <p className="mt-2 text-xs text-ink-soft">
          Payment: Cash on Delivery ·{" "}
          {order.paymentStatus === "paid" ? "Paid" : "Due on delivery"}
        </p>
      </div>
    </div>
  );
}
