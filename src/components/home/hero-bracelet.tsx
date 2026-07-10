"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import type { HeroBead } from "@/lib/catalog/hero-beads";

// The Three.js bundle is heavy — load it only on the client, after the page.
const HeroCanvas = dynamic(() => import("./hero-bracelet-canvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-linen to-sand" />
  ),
});

/**
 * Home-page hero: real catalog beads fall in and assemble into a rotating
 * bracelet as the visitor scrolls the first screen. Purely decorative
 * (pointer-events off) and static when reduced motion is preferred.
 */
export function HeroBracelet({ beads }: { beads: HeroBead[] }) {
  const progressRef = useRef(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onMq = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onMq);

    // Assemble over the first ~60% of a viewport of scrolling.
    const onScroll = () => {
      progressRef.current = Math.max(
        0,
        Math.min(1, window.scrollY / (window.innerHeight * 0.6))
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener?.("change", onMq);
    };
  }, []);

  return (
    <div className="relative aspect-square w-full">
      <HeroCanvas beads={beads} progressRef={progressRef} reduced={reduced} />
      {!reduced && (
        <p className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-ink-soft/70">
          Scroll to assemble
        </p>
      )}
    </div>
  );
}
