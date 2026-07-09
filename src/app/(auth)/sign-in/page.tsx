import type { Metadata } from "next";
import Link from "next/link";

import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div>
      <header className="text-center">
        <h1 className="font-serif text-3xl text-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Sign in to your saved designs and orders.
        </p>
      </header>

      <div className="mt-8 space-y-5">
        <GoogleButton />

        <div className="flex items-center gap-3 text-xs text-stone">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>

        <EmailAuthForm mode="sign-in" />
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link href="/sign-up" className="text-gold hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
