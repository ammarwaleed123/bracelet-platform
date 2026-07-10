import Image from "next/image";

import { formatPrice } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/db/schema";

export function OrderItemsList({ items }: { items: OrderItem[] }) {
  return (
    <ul className="space-y-4">
      {items.map((it) => (
        <li key={it.id} className="flex items-center gap-4">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-linen">
            {it.designThumbnailUrl && (
              <Image
                src={it.designThumbnailUrl}
                alt={it.designName}
                fill
                unoptimized
                sizes="56px"
                className="object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-medium text-ink">
              {it.designName}
            </p>
            <p className="text-xs text-ink-soft">
              Qty {it.quantity} · {formatPrice(it.unitPriceInPiastres)} each
            </p>
            {it.note && (
              <p className="mt-0.5 line-clamp-1 text-xs italic text-ink-soft">
                “{it.note}”
              </p>
            )}
          </div>
          <span className="text-sm tabular-nums text-ink">
            {formatPrice(it.unitPriceInPiastres * it.quantity)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ order }: { order: Order }) {
  return (
    <dl className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
      <Row label="Subtotal" value={formatPrice(order.subtotalInPiastres)} />
      <Row label="Shipping" value={formatPrice(order.shippingInPiastres)} />
      {order.discountInPiastres > 0 && (
        <Row
          label="Discount"
          value={`− ${formatPrice(order.discountInPiastres)}`}
        />
      )}
      {order.storeCreditAppliedInPiastres > 0 && (
        <Row
          label="Store credit"
          value={`− ${formatPrice(order.storeCreditAppliedInPiastres)}`}
        />
      )}
      <div className="flex justify-between border-t border-border pt-3 text-base">
        <dt className="font-medium text-ink">Total</dt>
        <dd className="font-serif tabular-nums text-ink">
          {formatPrice(order.totalInPiastres)}
        </dd>
      </div>
    </dl>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="tabular-nums text-ink">{value}</dd>
    </div>
  );
}
