import Link from "next/link";
import { notFound } from "next/navigation";

import { getOrderByNumber } from "@/lib/commerce/orders-query";
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

      <OrderTracker order={order} items={items} events={events} />
    </div>
  );
}
