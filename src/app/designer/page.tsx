import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getStudioCatalog } from "@/lib/catalog/studio";
import { getCurrentUser } from "@/lib/auth/guards";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { designer } from "@/content/designer";
import { DesignerFlow } from "@/components/designer/designer-flow";

export const metadata: Metadata = {
  title: designer.meta.title,
  description: designer.meta.description,
};

const FEATURE_ON = process.env.NEXT_PUBLIC_FEATURE_AI_DESIGNER === "1";

export default async function DesignerPage() {
  if (!FEATURE_ON) notFound();

  // Sign-in required — guests get a friendly gate instead of the flow.
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        <p className="label-caps">{designer.gate.eyebrow}</p>
        <h1 className="mt-3 max-w-md text-balance font-serif text-3xl text-ink sm:text-4xl">
          {designer.gate.title}
        </h1>
        <p className="mt-3 max-w-sm text-ink-soft">{designer.gate.body}</p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg">
            <Link href="/sign-in">{designer.gate.signIn}</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/sign-up">{designer.gate.createAccount}</Link>
          </Button>
        </div>
      </Container>
    );
  }

  const catalog = await getStudioCatalog();
  if (catalog.beads.length === 0 || catalog.bases.length === 0) notFound();

  return <DesignerFlow catalog={catalog} />;
}
