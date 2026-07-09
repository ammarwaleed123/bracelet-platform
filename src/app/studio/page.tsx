import type { Metadata } from "next";
import Link from "next/link";

import { getStudioCatalog } from "@/lib/catalog/studio";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { StudioShell } from "@/components/studio/studio-shell";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Design your own bracelet in a live 3D studio — choose a base, add meaningful stones and charms, and make it yours.",
};

export default async function StudioPage() {
  const catalog = await getStudioCatalog();

  // The studio needs at least a base and some beads to be usable.
  if (catalog.bases.length === 0 || catalog.beads.length === 0) {
    return (
      <Container className="py-24 text-center">
        <h1 className="font-serif text-3xl text-ink">The studio is warming up</h1>
        <p className="mt-3 text-ink-soft">
          Our catalog is being prepared. Please check back shortly.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Back home</Link>
        </Button>
      </Container>
    );
  }

  return <StudioShell catalog={catalog} />;
}
