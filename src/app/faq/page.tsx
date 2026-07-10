import type { Metadata } from "next";
import Link from "next/link";

import { faq } from "@/content/pages";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/home/reveal";

export const metadata: Metadata = {
  title: "FAQ",
  description: faq.intro,
};

export default function FaqPage() {
  return (
    <Container className="max-w-3xl py-16 sm:py-20">
      <Reveal>
        <p className="label-caps">{faq.eyebrow}</p>
        <h1 className="mt-3 font-serif text-4xl text-ink sm:text-5xl">
          {faq.title}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
          {faq.intro}
        </p>
      </Reveal>

      <div className="mt-12 space-y-12">
        {faq.groups.map((group) => (
          <Reveal key={group.title}>
            <h2 className="font-serif text-2xl text-ink">{group.title}</h2>
            <dl className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
              {group.items.map((item) => (
                <div key={item.q} className="p-5">
                  <dt className="font-medium text-ink">{item.q}</dt>
                  <dd className="mt-2 leading-relaxed text-ink-soft">{item.a}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12 rounded-2xl border border-border bg-linen/60 p-6 text-center">
        <p className="text-ink">Still have a question?</p>
        <Link
          href="/contact"
          className="mt-1 inline-block font-medium text-gold-strong underline underline-offset-2"
        >
          Get in touch
        </Link>
      </Reveal>
    </Container>
  );
}
