import Link from "next/link";

import { home } from "@/content/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export default function HomePage() {
  return (
    <Container className="flex flex-col items-center py-24 text-center sm:py-32">
      <p className="label-caps">{home.eyebrow}</p>
      <h1 className="mt-5 max-w-3xl text-balance font-serif text-5xl leading-[1.05] text-ink sm:text-6xl">
        {home.headline}
      </h1>
      <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-ink-soft">
        {home.subhead}
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href={home.primaryCta.href}>{home.primaryCta.label}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={home.secondaryCta.href}>{home.secondaryCta.label}</Link>
        </Button>
      </div>

      {/* Placeholder for the hero 3D bracelet / product photography.
          The full home experience lands in milestone 1.6. */}
      <div className="mt-16 w-full max-w-4xl">
        <div className="flex aspect-[16/10] items-center justify-center rounded-3xl border border-border bg-gradient-to-b from-linen to-sand shadow-soft">
          <p className="max-w-sm px-6 text-sm text-ink-soft">
            {home.buildingNote}
          </p>
        </div>
      </div>
    </Container>
  );
}
