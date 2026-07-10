"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";

import { formatPrice } from "@/lib/utils";

/**
 * A slim sticky cart bar shown on mobile only, when the cart isn't empty — one
 * tap to checkout. Hidden on the cart/checkout pages (redundant) and in the
 * full-screen studio (it would overlap the palette).
 */
export function MobileCartBar({
  count,
  subtotalInPiastres,
}: {
  count: number;
  subtotalInPiastres: number;
}) {
  const pathname = usePathname();
  if (count <= 0) return null;

  const hidden =
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/studio");
  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <Link
        href="/cart"
        className="pointer-events-auto mx-3 mb-3 flex items-center justify-between gap-3 rounded-full bg-ink px-5 py-3 text-cream shadow-lift"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <ShoppingBag className="size-4" aria-hidden />
          View cart · {count} item{count > 1 ? "s" : ""}
        </span>
        <span className="text-sm font-medium tabular-nums">
          {formatPrice(subtotalInPiastres)}
        </span>
      </Link>
    </div>
  );
}
