"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

import { home } from "@/content/site";
import type { HeroBead } from "@/lib/catalog/hero-beads";
import { Button } from "@/components/ui/button";

const CinematicCanvas = dynamic(
  () => import("./cinematic-bracelet-canvas"),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-cream" />,
  }
);

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const bump = (p: number, center: number, half: number) =>
  clamp01(1 - Math.abs(p - center) / half);
// A faint cream halo — the text sits below the ring, so this is just insurance.
const halo = "[text-shadow:0_1px_10px_rgba(250,248,245,0.75)]";

/**
 * Full-screen cinematic intro: the bracelet pins to the viewport (upper area)
 * and its animation is scrubbed by scroll, while short centred lines crossfade
 * in a band beneath it. Releases into the page after ~3 screens.
 */
export function CinematicIntro({ beads }: { beads: HeroBead[] }) {
  const progressRef = useRef(0);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hintRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onMq = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onMq);

    const setBeat = (i: number, o: number) => {
      const el = beatRefs.current[i];
      if (!el) return;
      el.style.opacity = String(o);
      el.style.transform = `translateY(${(1 - o) * 14}px)`;
      el.style.pointerEvents = o > 0.6 ? "auto" : "none";
    };

    let raf = 0;
    const apply = () => {
      raf = 0;
      const p = clamp01(window.scrollY / (window.innerHeight * 2));
      progressRef.current = p;
      setBeat(0, clamp01(1 - p / 0.3));
      setBeat(1, bump(p, 0.5, 0.24));
      setBeat(2, clamp01((p - 0.68) / 0.18));
      if (hintRef.current)
        hintRef.current.style.opacity = String(clamp01(1 - p / 0.12));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Pause the 3D render loop once the intro is scrolled out of view.
    let io: IntersectionObserver | undefined;
    if (sectionRef.current && "IntersectionObserver" in window) {
      io = new IntersectionObserver(
        ([entry]) => setActive(entry?.isIntersecting ?? true),
        { threshold: 0 }
      );
      io.observe(sectionRef.current);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener?.("change", onMq);
      io?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const setRef = (i: number) => (el: HTMLDivElement | null) => {
    beatRefs.current[i] = el;
  };

  return (
    <section ref={sectionRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* 3D layer */}
        <div className="absolute inset-0">
          {beads.length > 0 ? (
            <CinematicCanvas
              beads={beads}
              progressRef={progressRef}
              reduced={reduced}
              active={active}
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-b from-cream to-linen" />
          )}
        </div>

        {/* Text band, anchored below the ring so it never overlaps the beads. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[12vh] flex justify-center px-6">
          <div className="relative w-full max-w-2xl text-center">
            {/* Beat 0 — hero */}
            <div ref={setRef(0)} className="will-change-[opacity,transform]">
              <p className={`label-caps ${halo}`}>{home.eyebrow}</p>
              <h1
                className={`mt-4 text-balance font-serif text-5xl leading-[1.05] text-ink sm:text-6xl ${halo}`}
              >
                {home.headline}
              </h1>
              <p className={`mx-auto mt-5 max-w-md text-ink-soft ${halo}`}>
                {home.subhead}
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href={home.primaryCta.href}>{home.primaryCta.label}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={home.secondaryCta.href}>
                    {home.secondaryCta.label}
                  </Link>
                </Button>
              </div>
            </div>

            {/* Beat 1 — the craft */}
            <div
              ref={setRef(1)}
              className="absolute inset-x-0 bottom-0 opacity-0 will-change-[opacity,transform]"
            >
              <p className={`label-caps ${halo}`}>The craft</p>
              <h2
                className={`mt-3 text-balance font-serif text-4xl text-ink sm:text-5xl ${halo}`}
              >
                {home.valueProps[1].title}
              </h2>
              <p className={`mx-auto mt-4 max-w-md text-ink-soft ${halo}`}>
                {home.valueProps[1].body}
              </p>
            </div>

            {/* Beat 2 — meaning */}
            <div
              ref={setRef(2)}
              className="absolute inset-x-0 bottom-0 opacity-0 will-change-[opacity,transform]"
            >
              <p className={`label-caps ${halo}`}>{home.meaning.eyebrow}</p>
              <h2
                className={`mt-3 text-balance font-serif text-4xl text-ink sm:text-5xl ${halo}`}
              >
                {home.meaning.title}
              </h2>
              <p className={`mx-auto mt-4 max-w-md text-ink-soft ${halo}`}>
                {home.meaning.body}
              </p>
              <Button asChild size="lg" className="mt-6">
                <Link href={home.meaning.cta.href}>{home.meaning.cta.label}</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div
          ref={hintRef}
          className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center"
        >
          <span
            className={`text-xs uppercase tracking-[0.2em] text-ink-soft ${halo}`}
          >
            Scroll
          </span>
        </div>
      </div>
    </section>
  );
}
