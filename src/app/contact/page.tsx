import type { Metadata } from "next";
import { AtSign, Mail, MessageCircle } from "lucide-react";

import { contact } from "@/content/pages";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/home/reveal";

export const metadata: Metadata = {
  title: contact.title,
  description: contact.intro,
};

const ICONS = [MessageCircle, Mail, AtSign];

export default function ContactPage() {
  return (
    <Container className="max-w-3xl py-16 sm:py-20">
      <Reveal>
        <p className="label-caps">{contact.eyebrow}</p>
        <h1 className="mt-3 font-serif text-4xl text-ink sm:text-5xl">
          {contact.title}
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
          {contact.intro}
        </p>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {contact.channels.map((channel, i) => {
          const Icon = ICONS[i] ?? Mail;
          return (
            <Reveal key={channel.label} delay={i * 80}>
              <a
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-lift"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-gold-tint text-gold-strong">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="mt-4 label-caps">{channel.label}</span>
                <span className="mt-1 font-medium text-ink">{channel.value}</span>
                <span className="mt-1 text-sm text-ink-soft">{channel.note}</span>
              </a>
            </Reveal>
          );
        })}
      </div>

      <Reveal className="mt-10 space-y-3 rounded-2xl border border-border bg-linen/60 p-6">
        <p className="text-sm text-ink">
          <span className="font-medium">Hours:</span> {contact.hours}
        </p>
        <p className="text-sm text-ink-soft">{contact.note}</p>
      </Reveal>
    </Container>
  );
}
