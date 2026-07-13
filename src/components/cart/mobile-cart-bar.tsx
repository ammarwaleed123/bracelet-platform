"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";

/**
 * A slim sticky cart bar shown on mobile only, when the cart isn't empty — one
 * tap to checkout. Hidden on the home, cart, checkout, studio and designer pages.
 */
export function MobileCartBar({ count }: { count: number }) {
  const pathname = usePathname();
  if (count <= 0) return null;

  const hidden =
    pathname === "/" ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/studio") ||
    pathname.startsWith("/designer");
  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <Link
        href="/cart"
        className="pointer-events-auto mx-3 mb-3 flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream shadow-lift"
      >
        <ShoppingBag className="size-4" aria-hidden />
        View cart · {count} item{count > 1 ? "s" : ""}
      </Link>
    </div>
  );
}
