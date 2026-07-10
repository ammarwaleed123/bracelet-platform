import Link from "next/link";

import { footer, footerNav, site } from "@/content/site";
import { Container } from "@/components/layout/container";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-linen">
      <Container className="py-10 lg:py-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
          <div className="max-w-xs">
            <p className="font-serif text-lg text-ink">{site.name}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              {footer.blurb}
            </p>
          </div>

          {/* Link groups sit side-by-side even on the smallest screens so the
              footer stays short instead of a tall single-column stack. */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:gap-x-10 lg:gap-x-16">
            {footerNav.map((column) => (
              <div key={column.title}>
                <h2 className="label-caps">{column.title}</h2>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-ink-soft transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-5">
          <p className="text-xs text-ink-soft">
            {footer.rights(new Date().getFullYear())}
          </p>
        </div>
      </Container>
    </footer>
  );
}
