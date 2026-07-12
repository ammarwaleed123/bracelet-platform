import Link from "next/link";
import { Hammer, Palette, Truck } from "lucide-react";

import { home } from "@/content/site";
import { getGalleryDesigns } from "@/lib/designs/queries";
import { getHeroBeads } from "@/lib/catalog/hero-beads";
import type { GalleryItem } from "@/lib/designs/types";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { DesignCard } from "@/components/gallery/design-card";
import { CinematicIntro } from "@/components/home/cinematic-intro";
import { Reveal } from "@/components/home/reveal";

const VALUE_ICONS = [Palette, Hammer, Truck];

export default async function HomePage() {
  const [{ items: featured }, heroBeads] = await Promise.all([
    getGalleryDesigns({ sort: "most_liked", limit: 4 }),
    getHeroBeads(14),
  ]);
  const grid = featured.slice(0, 4);

  return (
    <div className="flex flex-col">
      {/* ------------------------------------------------ cinematic intro -- */}
      <CinematicIntro beads={heroBeads} />

      {/* --------- featured gallery: the first thing after the intro ------ */}
      {grid.length > 0 && (
        <div className="border-t border-border bg-linen/50">
          <Container className="py-20">
            <Reveal>
              <p className="label-caps">{home.featured.eyebrow}</p>
              <h2 className="mt-3 font-serif text-4xl text-ink">
                {home.featured.title}
              </h2>
              <p className="mt-2 max-w-md text-ink-soft">
                {home.featured.subhead}
              </p>
            </Reveal>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {grid.map((item, i) => (
                <Reveal key={item.id} delay={i * 80}>
                  <DesignCard item={{ ...item, liked: false } as GalleryItem} />
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-10 text-center">
              <Button asChild variant="outline" size="lg">
                <Link href={home.featured.cta.href}>
                  {home.featured.cta.label}
                </Link>
              </Button>
            </Reveal>
          </Container>
        </div>
      )}

      {/* --------------------------------------------------- value props -- */}
      <div className="border-y border-border">
        <Container className="grid gap-8 py-14 sm:grid-cols-3">
          {home.valueProps.map((prop, i) => {
            const Icon = VALUE_ICONS[i] ?? Palette;
            return (
              <Reveal key={prop.title} delay={i * 90}>
                <span className="flex size-11 items-center justify-center rounded-full bg-gold-tint text-gold-strong">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-serif text-xl text-ink">
                  {prop.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {prop.body}
                </p>
              </Reveal>
            );
          })}
        </Container>
      </div>

      {/* --------------------------------------------------- how it works -- */}
      <Container className="py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="label-caps">{home.steps.eyebrow}</p>
          <h2 className="mt-3 font-serif text-4xl text-ink">
            {home.steps.title}
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {home.steps.items.map((step, i) => (
            <Reveal
              key={step.n}
              delay={i * 110}
              className="rounded-2xl border border-border bg-card p-7"
            >
              <span className="font-serif text-3xl text-gold">{step.n}</span>
              <h3 className="mt-3 font-serif text-xl text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* ----------------------------------------------------- closing -- */}
      <div className="bg-ink">
        <Container className="py-20 text-center">
          <Reveal>
            <h2 className="mx-auto max-w-2xl text-balance font-serif text-4xl text-cream sm:text-5xl">
              {home.closing.title}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-cream/70">
              {home.closing.body}
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href={home.closing.cta.href}>{home.closing.cta.label}</Link>
            </Button>
          </Reveal>
        </Container>
      </div>
    </div>
  );
}
