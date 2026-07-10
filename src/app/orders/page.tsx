import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { TrackLookup } from "@/components/commerce/track-lookup";

export const metadata: Metadata = { title: "Track your order" };

export default function OrdersPage() {
  return (
    <Container className="max-w-xl py-16 sm:py-20">
      <p className="label-caps">Orders</p>
      <h1 className="mt-3 font-serif text-4xl text-ink sm:text-5xl">
        Track your order
      </h1>
      <p className="mt-5 text-lg leading-relaxed text-ink-soft">
        Enter your order number to see its status. You&apos;ll confirm with the
        phone number you used at checkout.
      </p>

      <div className="mt-8">
        <TrackLookup />
      </div>

      <p className="mt-6 text-sm text-ink-soft">
        Have an account?{" "}
        <Link
          href="/account"
          className="font-medium text-gold-strong underline underline-offset-2"
        >
          See all your orders
        </Link>
        .
      </p>
    </Container>
  );
}
