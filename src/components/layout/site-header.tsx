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

export function SiteHeader() {
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
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <BrandMark />
          <nav
            aria-label="Primary"
            className="hidden items-center gap-7 md:flex"
          >
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
          <Button asChild variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Link href={accountNav.account.href} aria-label={accountNav.account.label}>
              <User aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon">
            <Link href={accountNav.cart.href} aria-label={accountNav.cart.label}>
              <ShoppingBag aria-hidden />
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
            {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
          </Button>
        </div>
      </Container>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-16 bottom-0 z-40 border-t border-border bg-background md:hidden"
        >
          <Container className="flex h-full flex-col py-8">
            <nav aria-label="Mobile" className="flex flex-col gap-1">
              {primaryNav.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-3 font-serif text-2xl text-ink transition-colors hover:bg-sand",
                    isActive(link.href) && "text-gold"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <Button asChild size="lg">
                <Link href={primaryCta.href}>{primaryCta.label}</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={accountNav.signIn.href}>{accountNav.signIn.label}</Link>
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
