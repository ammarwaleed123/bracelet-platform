import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { Container } from "@/components/layout/container";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate the entire /admin subtree. Non-admins are redirected home.
  await requireAdmin();

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label-caps">Catalog manager</p>
          <h1 className="mt-1 font-serif text-2xl text-ink">Admin</h1>
        </div>
        <Link
          href="/"
          className="text-sm text-ink-soft transition-colors hover:text-ink"
        >
          ← Back to site
        </Link>
      </div>
      <div className="py-6">
        <AdminNav />
      </div>
      <div className="pt-2">{children}</div>
    </Container>
  );
}
