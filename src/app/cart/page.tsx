import type { Metadata } from "next";

import { getCartLines } from "@/lib/cart/cart";
import { Container } from "@/components/layout/container";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Cart" };

// Cart depends on the request (cookie / user), so it must render dynamically.
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const lines = await getCartLines();

  return (
    <Container className="py-12">
      <h1 className="mb-8 font-serif text-4xl text-ink">Your cart</h1>
      <CartView lines={lines} />
    </Container>
  );
}
