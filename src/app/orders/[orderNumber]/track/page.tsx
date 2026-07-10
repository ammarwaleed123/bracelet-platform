import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/guards";
import { getOrderByNumber } from "@/lib/commerce/orders-query";
import { Container } from "@/components/layout/container";
import { OrderTracker } from "@/components/commerce/order-tracker";
import { TrackGate } from "@/components/checkout/track-gate";

export const metadata: Metadata = { title: "Track order" };
export const dynamic = "force-dynamic";

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  const result = await getOrderByNumber(orderNumber);
  if (!result) notFound();

  // Logged-in owner sees it directly; everyone else must verify by phone.
  const isOwner = user != null && result.order.userId === user.id;

  return (
    <Container className="max-w-2xl py-14">
      {isOwner ? (
        <OrderTracker
          order={result.order}
          items={result.items}
          events={result.events}
        />
      ) : (
        <TrackGate orderNumber={orderNumber} />
      )}
    </Container>
  );
}
