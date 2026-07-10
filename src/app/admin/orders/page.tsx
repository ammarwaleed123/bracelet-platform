import Link from "next/link";

import { cn, formatPrice } from "@/lib/utils";
import { getAllOrders } from "@/lib/commerce/orders-query";
import { orderStatusLabel } from "@/lib/commerce/status";
import { AdminTable } from "@/components/admin/list";

export default async function AdminOrdersPage() {
  const rows = await getAllOrders();
  const toCraft = rows.filter((r) => r.status === "confirmed").length;

  return (
    <div>
      <h2 className="mb-2 font-serif text-xl text-ink">
        Orders <span className="text-ink-soft">({rows.length})</span>
      </h2>
      <p className="mb-6 text-sm text-ink-soft">
        {toCraft > 0
          ? `${toCraft} new — ready to craft.`
          : "No new orders to craft."}
      </p>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center text-ink-soft">
          No orders yet.
        </div>
      ) : (
        <AdminTable>
          <thead className="bg-linen text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Governorate</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Placed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.orderNumber} className="border-t border-border">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/orders/${o.orderNumber}`}
                    className="font-medium text-ink hover:text-gold"
                  >
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{o.customerName}</td>
                <td className="px-4 py-3 text-ink-soft">{o.governorate}</td>
                <td className="px-4 py-3 tabular-nums">
                  {formatPrice(o.totalInPiastres)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "text-xs font-medium",
                      o.paymentStatus === "paid"
                        ? "text-gold-strong"
                        : "text-ink-soft"
                    )}
                  >
                    {o.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      o.status === "cancelled"
                        ? "bg-destructive/10 text-destructive"
                        : o.status === "delivered"
                          ? "bg-gold-tint text-gold-strong"
                          : o.status === "pending_confirmation"
                            ? "bg-sand text-ink"
                            : "bg-linen text-ink"
                    )}
                  >
                    {orderStatusLabel(o.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-soft">
                  {new Date(o.placedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </AdminTable>
      )}
    </div>
  );
}
