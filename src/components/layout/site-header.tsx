"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, User, X } from "lucide-react";

import { accountNav, primaryCta, primaryNav } from "@/content/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/brand-mark";
import { Container } from "@/components/layout/container";

export function SiteHeader({ cartCount = 0 }: { cartCount?: number }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu whenever navigation completes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile menu overlay is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <BrandMark />
            <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
              {primaryNav.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "text-sm text-ink-soft transition-colors hover:text-ink",
                    isActive(link.href) && "text-ink"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link
                href={accountNav.account.href}
                aria-label={accountNav.account.label}
              >
                <User aria-hidden />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link href={accountNav.cart.href} aria-label={accountNav.cart.label}>
                <ShoppingBag aria-hidden />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-medium leading-4 text-cream">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href={primaryCta.href}>{primaryCta.label}</Link>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {/* Crossfade + rotate between the open (☰) and close (✕) icons. */}
              <span className="relative block size-4">
                <Menu
                  aria-hidden
                  className={cn(
                    "absolute inset-0 transition-all duration-200 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
                    menuOpen
                      ? "rotate-90 scale-50 opacity-0"
                      : "rotate-0 scale-100 opacity-100"
                  )}
                />
                <X
                  aria-hidden
                  className={cn(
                    "absolute inset-0 transition-all duration-200 ease-[var(--ease-out-soft)] motion-reduce:transition-none",
                    menuOpen
                      ? "rotate-0 scale-100 opacity-100"
                      : "-rotate-90 scale-50 opacity-0"
                  )}
                />
              </span>
            </Button>
          </div>
        </Container>
      </header>

      {/*
        Rendered OUTSIDE <header> on purpose: the header's backdrop-blur is a
        containing block for fixed descendants, which would trap this overlay
        inside the 64px header box. As a sibling of the header it covers the
        viewport correctly. Opaque background hides the page beneath.
      */}
      {/*
        Kept mounted (not conditionally rendered) so it can animate BOTH open
        and closed. `transition-all` lets `visibility` flip only after the fade
        finishes, so the panel stays interactive-free but visible during exit.
      */}
      <div
        id="mobile-menu"
        aria-hidden={!menuOpen}
        className={cn(
          "fixed inset-x-0 bottom-0 top-16 z-50 bg-cream transition-all duration-200 ease-[var(--ease-out-soft)] md:hidden motion-reduce:transition-none",
          menuOpen
            ? "translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0 pointer-events-none"
        )}
      >
        <Container className="flex h-full flex-col py-8">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {primaryNav.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                tabIndex={menuOpen ? undefined : -1}
                style={{ transitionDelay: menuOpen ? `${i * 45}ms` : "0ms" }}
                className={cn(
                  "rounded-lg px-3 py-3 font-serif text-2xl text-ink transition-[color,transform,opacity] duration-200 ease-[var(--ease-out-soft)] hover:bg-sand motion-reduce:translate-y-0 motion-reduce:transition-none",
                  menuOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
                  isActive(link.href) && "text-gold"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div
            style={{
              transitionDelay: menuOpen ? `${primaryNav.length * 45}ms` : "0ms",
            }}
            className={cn(
              "mt-auto flex flex-col gap-3 pt-8 transition-[transform,opacity] duration-200 ease-[var(--ease-out-soft)] motion-reduce:translate-y-0 motion-reduce:transition-none",
              menuOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
            )}
          >
            <Button asChild size="lg">
              <Link href={primaryCta.href} tabIndex={menuOpen ? undefined : -1}>
                {primaryCta.label}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link
                href={accountNav.account.href}
                tabIndex={menuOpen ? undefined : -1}
              >
                {accountNav.account.label}
              </Link>
            </Button>
          </div>
        </Container>
      </div>
    </>
  );
}
