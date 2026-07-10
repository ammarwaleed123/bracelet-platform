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
 * A gently rotating 3D bracelet of real catalog beads for the home-page hero.
 * Purely decorative (pointer-events off); a hint of scroll nudges its tilt.
 * Static under prefers-reduced-motion.
 */
export function HeroBracelet({ beads }: { beads: HeroBead[] }) {
  const progressRef = useRef(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onMq = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onMq);

    const onScroll = () => {
      progressRef.current = Math.max(
        0,
        Math.min(1, window.scrollY / window.innerHeight)
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
    </div>
  );
}
