import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getOrderByNumber,
  getOrderDesignCards,
} from "@/lib/commerce/orders-query";
import { OrderTracker } from "@/components/commerce/order-tracker";
import { OrderStatusControls } from "@/components/admin/order-status-controls";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const result = await getOrderByNumber(orderNumber);
  if (!result) notFound();
  const { order, items, events } = result;
  const passportCards = await getOrderDesignCards(order.id);

  return (
    <div className="space-y-8">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        ← All orders
      </Link>

      <div className="rounded-2xl border border-border bg-linen p-5">
        <h2 className="mb-3 font-serif text-lg text-ink">Update status</h2>
        <OrderStatusControls
          orderNumber={order.orderNumber}
          status={order.status}
          paymentStatus={order.paymentStatus}
        />
        {order.customerEmail && (
          <p className="mt-3 text-xs text-ink-soft">
            Contact: {order.customerEmail}
          </p>
        )}
      </div>

      {passportCards.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-1 font-serif text-lg text-ink">Passport cards</h2>
          <p className="mb-4 text-xs text-ink-soft">
            Print one card per bracelet and place it in the box.
          </p>
          <ul className="divide-y divide-border">
            {passportCards.map((card) => (
              <li
                key={card.publicId}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="text-sm text-ink">
                  {card.designName}
                  {card.quantity > 1 && (
                    <span className="text-ink-soft"> · ×{card.quantity}</span>
                  )}
                </span>
                <Link
                  href={`/design/${card.publicId}/card`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-full border border-border px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-linen"
                >
                  Print passport card →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <OrderTracker order={order} items={items} events={events} />
    </div>
  );
}
