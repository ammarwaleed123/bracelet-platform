"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, X } from "lucide-react";

import { signupPrompt } from "@/content/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Remember dismissal so it never nags. Bump the suffix to re-show it to everyone.
const DISMISS_KEY = "aurelia:signup-promo-v1";
const SHOW_DELAY_MS = 1200;

// Redundant where the visitor is already signing in / creating an account.
const HIDDEN_ON = ["/sign-in", "/sign-up"];

/**
 * A one-time, dismissable popup for logged-out visitors that points them to
 * create an account. Rendered only when there's no user (see the root layout).
 * Purely a prompt — the buttons link to the existing auth pages.
 */
export function SignupPromo() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // in the DOM (animate in/out)
  const [shown, setShown] = useState(false); // entered (drives the transition)

  useEffect(() => {
    if (HIDDEN_ON.some((p) => pathname.startsWith(p))) {
      setShown(false);
      setOpen(false);
      return;
    }
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // Private mode / storage disabled — just show it this once.
    }
    if (dismissed || open) return;

    const t = setTimeout(() => {
      setOpen(true);
      // Two frames so the element is painted closed before it transitions open.
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    }, SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [pathname, open]);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setShown(false);
    setTimeout(() => setOpen(false), 250); // let the exit transition finish
  };

  // Lock page scroll + close on Escape while visible.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-promo-title"
      className={cn(
        "fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 transition-opacity duration-300 ease-out motion-reduce:transition-none sm:pt-24",
        shown ? "opacity-100" : "opacity-0"
      )}
    >
      {/* Backdrop — click to dismiss. */}
      <button
        type="button"
        aria-label={signupPrompt.close}
        onClick={dismiss}
        className="absolute inset-0 -z-10 cursor-default bg-ink/40 backdrop-blur-[2px]"
      />

      {/* Card */}
      <div
        className={cn(
          "relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-lift transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          shown ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        )}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label={signupPrompt.close}
          className="absolute right-4 top-4 -m-1 p-1 text-ink-soft transition-colors hover:text-ink"
        >
          <X className="size-5" aria-hidden />
        </button>

        <h2
          id="signup-promo-title"
          className="max-w-[15rem] text-balance font-serif text-2xl leading-tight text-ink"
        >
          {signupPrompt.title}
        </h2>

        <ul className="mt-5 flex flex-col gap-3">
          {signupPrompt.points.map((point) => (
            <li
              key={point}
              className="flex items-start gap-3 text-sm text-ink-soft"
            >
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-sand text-gold">
                <Check className="size-3.5" aria-hidden />
              </span>
              {point}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-2.5">
          <Button asChild size="lg" onClick={dismiss}>
            <Link href={signupPrompt.createAccount.href}>
              {signupPrompt.createAccount.label}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" onClick={dismiss}>
            <Link href={signupPrompt.signIn.href}>
              {signupPrompt.signIn.label}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
