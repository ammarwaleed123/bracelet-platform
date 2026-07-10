import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getCartLines } from "@/lib/cart/cart";
import { getActiveShippingZones } from "@/lib/commerce/shipping";
import { getCurrentUser } from "@/lib/auth/guards";
import { Container } from "@/components/layout/container";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export type GovernorateOption = {
  name: string;
  feeInPiastres: number;
  estimatedDays: string | null;
};

export default async function CheckoutPage() {
  const lines = await getCartLines();
  if (lines.length === 0) redirect("/cart");

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotalInPiastres, 0);

  const zones = await getActiveShippingZones();
  const governorates: GovernorateOption[] = zones
    .flatMap((z) =>
      z.governorates.map((name) => ({
        name,
        feeInPiastres: z.feeInPiastres,
        estimatedDays: z.estimatedDays,
      }))
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const user = await getCurrentUser();
  const defaults = {
    name:
      (user?.user_metadata?.full_name as string | undefined) ?? "",
    email: user?.email ?? "",
  };

  // Signed-in customers can spend their store credit (on the product cost).
  let storeCredit = 0;
  if (user) {
    const [p] = await db
      .select({ credit: profiles.storeCreditInPiastres })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    storeCredit = p?.credit ?? 0;
  }

  return (
    <Container className="py-12">
      <h1 className="mb-8 font-serif text-4xl text-ink">Checkout</h1>
      <CheckoutForm
        lines={lines}
        subtotalInPiastres={subtotal}
        governorates={governorates}
        defaults={defaults}
        storeCredit={storeCredit}
      />
    </Container>
  );
}
