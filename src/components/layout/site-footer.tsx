import Link from "next/link";

import { footer, footerNav, site } from "@/content/site";
import { Container } from "@/components/layout/container";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-linen">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs">
            <p className="font-serif text-lg text-ink">{site.name}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {footer.blurb}
            </p>
          </div>

          {footerNav.map((column) => (
            <div key={column.title}>
              <h2 className="label-caps">{column.title}</h2>
              <ul className="mt-4 space-y-3">
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

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-xs text-ink-soft">
            {footer.rights(new Date().getFullYear())}
          </p>
        </div>
      </Container>
    </footer>
  );
}
