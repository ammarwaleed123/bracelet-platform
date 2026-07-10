import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/home/reveal";

type PolicySection = { heading: string; body: string[] };

export function PolicyPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: string;
  sections: PolicySection[];
}) {
  return (
    <Container className="max-w-3xl py-16 sm:py-20">
      <Reveal>
        <h1 className="font-serif text-4xl text-ink sm:text-5xl">{title}</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated: {updated}</p>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">{intro}</p>
      </Reveal>

      <div className="mt-12 space-y-10">
        {sections.map((section) => (
          <Reveal key={section.heading}>
            <h2 className="font-serif text-2xl text-ink">{section.heading}</h2>
            <div className="mt-3 space-y-3">
              {section.body.map((para) => (
                <p key={para} className="leading-relaxed text-ink-soft">
                  {para}
                </p>
              ))}
            </div>
          </Reveal>
        ))}
      </div>
    </Container>
  );
}
