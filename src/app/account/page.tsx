import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/layout/container";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const name =
    (user.user_metadata?.full_name as string | undefined) ?? user.email;

  return (
    <Container className="py-16">
      <p className="label-caps">Account</p>
      <h1 className="mt-3 font-serif text-4xl text-ink">Hello, {name}</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        Your orders, saved designs, and addresses will live here. The full
        dashboard arrives with the commerce milestone.
      </p>
      <div className="mt-8">
        <SignOutButton />
      </div>
    </Container>
  );
}
