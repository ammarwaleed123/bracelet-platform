import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { env } from "@/lib/env";
import { getStudioCatalog } from "@/lib/catalog/studio";
import { ArClient } from "@/components/ar/ar-client";

export const metadata: Metadata = {
  title: "See it on your wrist",
  // Prototype behind a flag — keep it out of search indexes.
  robots: { index: false, follow: false },
};

export default async function ArPage() {
  // Feature-flag gate: the route simply doesn't exist unless AR is enabled.
  // (The NEXT_PUBLIC flag is inlined at build time, so this resolves at build.)
  if (!env.features.ar) notFound();

  const catalog = await getStudioCatalog();
  return <ArClient catalog={catalog} siteUrl={env.siteUrl} />;
}
