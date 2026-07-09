import Link from "next/link";

import { site } from "@/content/site";
import { cn } from "@/lib/utils";

/** The wordmark. A real logo replaces this before launch (GUIDE Part 6). */
export function BrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${site.name} — home`}
      className={cn(
        "font-serif text-xl tracking-tight text-ink transition-opacity hover:opacity-80",
        className
      )}
    >
      {site.name}
    </Link>
  );
}
