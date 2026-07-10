"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

import type { HeroBead } from "@/lib/catalog/hero-beads";

// The Three.js bundle is heavy — load it only on the client, after the page.
const HeroCanvas = dynamic(() => import("./hero-bracelet-canvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gradient-to-b from-linen to-sand" />
  ),
});

/**
 * The persistent 3D bracelet for the home-page scroll journey. Real catalog
 * beads fall in and assemble into a bracelet, which then tilts, grows and turns
 * as the visitor scrolls through the narrative beats. Fills its (pinned)
 * container, is purely decorative (pointer-events off), and stays static under
 * prefers-reduced-motion.
 */
export function HeroBracelet({ beads }: { beads: HeroBead[] }) {
  const progressRef = useRef(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onMq = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onMq);

    // Progress runs 0 → 1 over roughly the journey's pinned scroll range.
    const onScroll = () => {
      progressRef.current = Math.max(
        0,
        Math.min(1, window.scrollY / (window.innerHeight * 2.2))
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
    <div className="relative h-full w-full">
      <HeroCanvas beads={beads} progressRef={progressRef} reduced={reduced} />
    </div>
  );
}
