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

// The header account icon this card hangs from (see site-header.tsx).
const ANCHOR_ID = "account-nav-trigger";

type Anchor = { x: number; top: number };

/**
 * A one-time, dismissable card for logged-out visitors that drops down from the
 * header account icon (with a pointer under it) to nudge them to make an account.
 * Rendered only when there's no user (see the root layout). Purely a prompt —
 * the buttons link to the existing auth pages.
 */
export function SignupPromo() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // in the DOM (animate in/out)
  const [shown, setShown] = useState(false); // entered (drives the transition)
  const [anchor, setAnchor] = useState<Anchor | null>(null);

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

  // Measure the account icon so the card + pointer line up under it, and keep
  // it aligned as the viewport changes.
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const el = document.getElementById(ANCHOR_ID);
      if (el) {
        const r = el.getBoundingClientRect();
        setAnchor({ x: r.left + r.width / 2, top: r.bottom + 14 });
      } else {
        setAnchor(null);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open]);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setShown(false);
    setTimeout(() => setOpen(false), 250); // let the exit transition finish
  };

  // Close on Escape while visible. (No scroll lock — it's an anchored dropdown,
  // not a blocking modal; the page stays usable behind it.)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  // Fallbacks keep it sensible if the anchor can't be measured for any reason.
  const cardTop = anchor?.top ?? 72;
  const caretX =
    anchor?.x ??
    (typeof window !== "undefined" ? window.innerWidth - 90 : 320);

  return (
    <>
      {/* Light scrim, below the header (z-40) so the header stays crisp while
          the page dims a little. Click anywhere to dismiss. */}
      <button
        type="button"
        aria-label={signupPrompt.close}
        onClick={dismiss}
        className={cn(
          "fixed inset-0 z-30 cursor-default bg-ink/20 transition-opacity duration-300 ease-out motion-reduce:transition-none",
          shown ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Pointer, sitting on the card's top edge, centered under the account
          icon. Decorative — clicks pass through to the card/scrim. */}
      <span
        aria-hidden
        style={{
          top: cardTop,
          left: caretX,
          transform: "translate(-50%, -50%) rotate(45deg)",
        }}
        className={cn(
          "pointer-events-none fixed z-50 size-3 rounded-[2px] border-l border-t border-border bg-card transition-opacity duration-300 ease-out motion-reduce:transition-none",
          shown ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Card */}
      <div
        role="dialog"
        aria-modal="false"
        aria-labelledby="signup-promo-title"
        style={{ top: cardTop }}
        className={cn(
          "fixed inset-x-4 z-50 rounded-2xl border border-border bg-card p-5 shadow-lift transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:inset-x-auto sm:right-4 sm:w-[22rem]",
          shown ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
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
          className="max-w-[15rem] text-balance font-serif text-xl leading-tight text-ink"
        >
          {signupPrompt.title}
        </h2>

        <ul className="mt-4 flex flex-col gap-2.5">
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

        <div className="mt-5 flex flex-col gap-2.5">
          <Button asChild onClick={dismiss}>
            <Link href={signupPrompt.createAccount.href}>
              {signupPrompt.createAccount.label}
            </Link>
          </Button>
          <Button asChild variant="outline" onClick={dismiss}>
            <Link href={signupPrompt.signIn.href}>
              {signupPrompt.signIn.label}
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
