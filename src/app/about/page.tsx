import type { Metadata } from "next";
import Link from "next/link";

import { about } from "@/content/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/home/reveal";

export const metadata: Metadata = {
  title: "About",
  description: about.intro,
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* ---------------------------------------------------------- hero -- */}
      <Container className="py-20 sm:py-28">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="label-caps">{about.eyebrow}</p>
          <h1 className="mt-5 text-balance font-serif text-5xl leading-[1.05] text-ink sm:text-6xl">
            {about.headline}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-ink-soft">
            {about.intro}
          </p>
        </Reveal>
      </Container>

      {/* --------------------------------------------------------- story -- */}
      <div className="border-y border-border bg-linen/60">
        <Container className="py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <Reveal>
              <h2 className="font-serif text-4xl text-ink">
                {about.story.title}
              </h2>
            </Reveal>
            <Reveal delay={100} className="space-y-5">
              {about.story.body.map((para) => (
                <p key={para} className="text-lg leading-relaxed text-ink-soft">
                  {para}
                </p>
              ))}
            </Reveal>
          </div>
        </Container>
      </div>

      {/* --------------------------------------------------------- craft -- */}
      <Container className="py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="label-caps">{about.craft.eyebrow}</p>
          <h2 className="mt-3 font-serif text-4xl text-ink">
            {about.craft.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            {about.craft.body}
          </p>
        </Reveal>
      </Container>

      {/* -------------------------------------------------------- values -- */}
      <div className="border-t border-border bg-linen/50">
        <Container className="py-20">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {about.values.map((value, i) => (
              <Reveal
                key={value.title}
                delay={i * 90}
                className="rounded-2xl border border-border bg-card p-7"
              >
                <span className="font-serif text-3xl text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-serif text-xl text-ink">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {value.body}
                </p>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* ----------------------------------------------------------- cta -- */}
      <div className="bg-ink">
        <Container className="py-20 text-center">
          <Reveal>
            <h2 className="mx-auto max-w-2xl text-balance font-serif text-4xl text-cream sm:text-5xl">
              {about.cta.title}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-cream/70">
              {about.cta.body}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={about.cta.primary.href}>
                  {about.cta.primary.label}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-cream/30 text-cream hover:bg-cream/10"
              >
                <Link href={about.cta.secondary.href}>
                  {about.cta.secondary.label}
                </Link>
              </Button>
            </div>
          </Reveal>
        </Container>
      </div>
    </div>
  );
}
