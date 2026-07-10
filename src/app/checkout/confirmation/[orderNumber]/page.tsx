import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { formatPrice } from "@/lib/utils";
import { getOrderByNumber } from "@/lib/commerce/orders-query";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { OrderItemsList, OrderTotals } from "@/components/commerce/order-detail";

export const metadata: Metadata = { title: "Order confirmed" };
export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const result = await getOrderByNumber(orderNumber);
  if (!result) notFound();
  const { order, items } = result;

  return (
    <Container className="max-w-2xl py-14">
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-12 text-gold" aria-hidden />
        <h1 className="mt-4 font-serif text-3xl text-ink">Thank you!</h1>
        <p className="mt-2 text-ink-soft">
          Your order is placed. We&apos;ll call{" "}
          <span className="text-ink">{order.customerPhone}</span> to confirm.
        </p>
        <p className="mt-4 inline-block rounded-full border border-border bg-card px-4 py-1.5 text-sm">
          Order <span className="font-medium text-ink">{order.orderNumber}</span>
        </p>
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <OrderItemsList items={items} />
        <OrderTotals order={order} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild>
          <Link href={`/orders/${order.orderNumber}/track`}>Track your order</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/gallery">Continue exploring</Link>
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-ink-soft">
        Total due on delivery: {formatPrice(order.totalInPiastres)} (Cash on Delivery)
      </p>
    </Container>
  );
}
