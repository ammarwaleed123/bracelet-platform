import Link from "next/link";
import Image from "next/image";
import { Hammer, Palette, Truck } from "lucide-react";

import { home } from "@/content/site";
import { formatPrice } from "@/lib/utils";
import { getGalleryDesigns } from "@/lib/designs/queries";
import type { GalleryItem } from "@/lib/designs/types";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { DesignCard } from "@/components/gallery/design-card";

const VALUE_ICONS = [Palette, Hammer, Truck];

export default async function HomePage() {
  const { items: featured } = await getGalleryDesigns({
    sort: "most_liked",
    limit: 5,
  });
  const hero = featured[0] ?? null;
  const grid = featured.slice(1, 5);

  return (
    <div className="flex flex-col">
      {/* ---------------------------------------------------------- hero -- */}
      <Container className="grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="label-caps">{home.eyebrow}</p>
          <h1 className="mt-5 text-balance font-serif text-5xl leading-[1.05] text-ink sm:text-6xl">
            {home.headline}
          </h1>
          <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-ink-soft">
            {home.subhead}
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href={home.primaryCta.href}>{home.primaryCta.label}</Link>
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

        {/* Hero visual — the most-loved community design, or a soft fallback. */}
        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gold-tint/40 blur-2xl" />
          {hero ? (
            <Link
              href={`/design/${hero.publicId}`}
              className="group block overflow-hidden rounded-3xl border border-border bg-linen shadow-lift"
            >
              <div className="relative aspect-square">
                {hero.thumbnailUrl && (
                  <Image
                    src={hero.thumbnailUrl}
                    alt={hero.name}
                    fill
                    unoptimized
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                )}
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <span className="font-serif text-lg text-ink">{hero.name}</span>
                <span className="tabular-nums text-ink-soft">
                  {formatPrice(hero.priceInPiastres)}
                </span>
              </div>
            </Link>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-3xl border border-border bg-gradient-to-b from-linen to-sand shadow-soft">
              <p className="max-w-xs px-6 text-center text-sm text-ink-soft">
                Your design, brought to life in 3D.
              </p>
            </div>
          )}
        </div>
      </Container>

      {/* --------------------------------------------------- value props -- */}
      <div className="border-y border-border bg-linen/60">
        <Container className="grid gap-8 py-14 sm:grid-cols-3">
          {home.valueProps.map((prop, i) => {
            const Icon = VALUE_ICONS[i] ?? Palette;
            return (
              <div key={prop.title}>
                <span className="flex size-11 items-center justify-center rounded-full bg-gold-tint text-gold-strong">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-serif text-xl text-ink">
                  {prop.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {prop.body}
                </p>
              </div>
            );
          })}
        </Container>
      </div>

      {/* --------------------------------------------------- how it works -- */}
      <Container className="py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="label-caps">{home.steps.eyebrow}</p>
          <h2 className="mt-3 font-serif text-4xl text-ink">
            {home.steps.title}
          </h2>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {home.steps.items.map((step) => (
            <div key={step.n} className="rounded-2xl border border-border bg-card p-7">
              <span className="font-serif text-3xl text-gold">{step.n}</span>
              <h3 className="mt-3 font-serif text-xl text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </Container>

      {/* ---------------------------------------------------- featured -- */}
      {grid.length > 0 && (
        <div className="border-t border-border bg-linen/50">
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

      {/* ----------------------------------------------------- meaning -- */}
      <Container className="py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="label-caps">{home.meaning.eyebrow}</p>
          <h2 className="mt-3 font-serif text-4xl text-ink">
            {home.meaning.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            {home.meaning.body}
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href={home.meaning.cta.href}>{home.meaning.cta.label}</Link>
          </Button>
        </div>
      </Container>

      {/* ----------------------------------------------------- closing -- */}
      <div className="bg-ink">
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
