import Link from "next/link";

import { home } from "@/content/site";
import { getGalleryDesigns } from "@/lib/designs/queries";
import { getHeroBeads } from "@/lib/catalog/hero-beads";
import type { GalleryItem } from "@/lib/designs/types";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { DesignCard } from "@/components/gallery/design-card";
import { HeroBracelet } from "@/components/home/hero-bracelet";

// Readable scrim behind beat copy on mobile (where it overlaps the 3D);
// invisible on desktop, where the copy sits in the clear left column.
const beatCard =
  "rounded-3xl bg-cream/70 p-6 backdrop-blur-sm sm:p-8 lg:bg-transparent lg:p-0 lg:backdrop-blur-none";

export default async function HomePage() {
  const [{ items: featured }, heroBeads] = await Promise.all([
    getGalleryDesigns({ sort: "most_liked", limit: 4 }),
    getHeroBeads(14),
  ]);
  const grid = featured.slice(0, 4);
  const craft = home.valueProps[1];

  return (
    <div className="flex flex-col">
      {/* ===================================================== journey ===== */}
      <section className="relative">
        {/* Pinned 3D: a top band on mobile, the right half on desktop. */}
        <div className="pointer-events-none sticky top-16 z-0 h-[46vh] lg:top-0 lg:ml-[50%] lg:h-screen lg:w-1/2">
          {heroBeads.length > 0 ? (
            <HeroBracelet beads={heroBeads} />
          ) : (
            <div className="h-full w-full bg-gradient-to-b from-linen to-sand" />
          )}
        </div>

        {/* Narrative beats scroll over / beside the pinned bracelet. */}
        <div className="relative z-10 -mt-[46vh] lg:-mt-[100vh]">
          {/* Beat 1 — hero */}
          <div className="flex min-h-screen items-center">
            <Container>
              <div className="max-w-xl lg:max-w-md">
                <div className={beatCard}>
                  <p className="label-caps">{home.eyebrow}</p>
                  <h1 className="mt-5 text-balance font-serif text-5xl leading-[1.05] text-ink sm:text-6xl">
                    {home.headline}
                  </h1>
                  <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-ink-soft">
                    {home.subhead}
                  </p>
                  <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                    <Button asChild size="lg">
                      <Link href={home.primaryCta.href}>
                        {home.primaryCta.label}
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link href={home.secondaryCta.href}>
                        {home.secondaryCta.label}
                      </Link>
                    </Button>
                  </div>
                  <p className="mt-6 text-sm text-ink-soft">
                    Handmade in Egypt · Cash on delivery nationwide
                  </p>
                </div>
              </div>
            </Container>
          </div>

          {/* Beat 2 — the craft */}
          <div className="flex min-h-screen items-center">
            <Container>
              <div className="max-w-xl lg:max-w-md">
                <div className={beatCard}>
                  <p className="label-caps">The craft</p>
                  <h2 className="mt-4 font-serif text-4xl text-ink sm:text-5xl">
                    {craft.title}
                  </h2>
                  <p className="mt-5 text-lg leading-relaxed text-ink-soft">
                    {craft.body}
                  </p>
                </div>
              </div>
            </Container>
          </div>

          {/* Beat 3 — meaning */}
          <div className="flex min-h-screen items-center">
            <Container>
              <div className="max-w-xl lg:max-w-md">
                <div className={beatCard}>
                  <p className="label-caps">{home.meaning.eyebrow}</p>
                  <h2 className="mt-4 font-serif text-4xl text-ink sm:text-5xl">
                    {home.meaning.title}
                  </h2>
                  <p className="mt-5 text-lg leading-relaxed text-ink-soft">
                    {home.meaning.body}
                  </p>
                  <Button asChild size="lg" className="mt-8">
                    <Link href={home.meaning.cta.href}>
                      {home.meaning.cta.label}
                    </Link>
                  </Button>
                </div>
              </div>
            </Container>
          </div>
        </div>
      </section>

      {/* ================================================== how it works ==== */}
      <div className="relative z-10 border-t border-border bg-cream">
        <Container className="py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="label-caps">{home.steps.eyebrow}</p>
            <h2 className="mt-3 font-serif text-4xl text-ink">
              {home.steps.title}
            </h2>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {home.steps.items.map((step) => (
              <div
                key={step.n}
                className="rounded-2xl border border-border bg-card p-7"
              >
                <span className="font-serif text-3xl text-gold">{step.n}</span>
                <h3 className="mt-3 font-serif text-xl text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </div>

      {/* ==================================================== featured ===== */}
      {grid.length > 0 && (
        <div className="relative z-10 border-t border-border bg-linen/50">
          <Container className="py-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="label-caps">{home.featured.eyebrow}</p>
                <h2 className="mt-3 font-serif text-4xl text-ink">
                  {home.featured.title}
                </h2>
                <p className="mt-2 max-w-md text-ink-soft">
                  {home.featured.subhead}
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href={home.featured.cta.href}>
                  {home.featured.cta.label}
                </Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {grid.map((item) => (
                <DesignCard
                  key={item.id}
                  item={{ ...item, liked: false } as GalleryItem}
                />
              ))}
            </div>
          </Container>
        </div>
      )}

      {/* ===================================================== closing ===== */}
      <div className="relative z-10 bg-ink">
        <Container className="py-20 text-center">
          <h2 className="mx-auto max-w-2xl text-balance font-serif text-4xl text-cream sm:text-5xl">
            {home.closing.title}
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-cream/70">
            {home.closing.body}
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href={home.closing.cta.href}>{home.closing.cta.label}</Link>
          </Button>
        </Container>
      </div>
    </div>
  );
}
