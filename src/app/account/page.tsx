import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getUserDesigns } from "@/lib/designs/queries";
import { getUserOrders } from "@/lib/commerce/orders-query";
import { getCreatorEarnings } from "@/lib/commerce/commissions";
import { formatPrice } from "@/lib/utils";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AccountDesigns } from "@/components/account/account-designs";
import { AccountOrders } from "@/components/account/account-orders";
import { AccountEarnings } from "@/components/account/account-earnings";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [[profile], designs, orders, earnings] = await Promise.all([
    db
      .select({ role: profiles.role, credit: profiles.storeCreditInPiastres })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1),
    getUserDesigns(user.id),
    getUserOrders(user.id),
    getCreatorEarnings(user.id),
  ]);
  const isAdmin = profile?.role === "admin";
  const storeCredit = profile?.credit ?? 0;

  const name =
    (user.user_metadata?.full_name as string | undefined) ?? user.email;

  return (
    <Container className="py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-caps">Account</p>
          <h1 className="mt-3 font-serif text-4xl text-ink">Hello, {name}</h1>
          {storeCredit > 0 && (
            <p className="mt-2 text-sm text-gold-strong">
              Store credit: {formatPrice(storeCredit)}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <Button asChild variant="secondary">
              <Link href="/admin">Open admin</Link>
            </Button>
          )}
          <SignOutButton />
        </div>
      </div>

      {earnings.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-serif text-2xl text-ink">Creator earnings</h2>
          <AccountEarnings earnings={earnings} storeCreditInPiastres={storeCredit} />
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-4 font-serif text-2xl text-ink">Your orders</h2>
        <AccountOrders orders={orders} />
      </section>

      <section className="mt-12">
        <h2 className="mb-4 font-serif text-2xl text-ink">Your designs</h2>
        <AccountDesigns designs={designs} />
      </section>
    </Container>
  );
}
