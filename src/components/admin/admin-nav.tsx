"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { label: "Dashboard", href: "/admin" },
  { label: "Bases", href: "/admin/bases" },
  { label: "Beads", href: "/admin/beads" },
  { label: "Charms", href: "/admin/charms" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Gallery", href: "/admin/gallery" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Settings", href: "/admin/settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="flex flex-wrap gap-1" aria-label="Admin">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={isActive(link.href) ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-sand hover:text-ink",
            isActive(link.href) && "bg-ink text-cream hover:bg-ink hover:text-cream"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
