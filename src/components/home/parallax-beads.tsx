"use client";

import { useEffect, useRef } from "react";

/**
 * Soft, blurred "bead" orbs that drift upward at different speeds as the page
 * scrolls — a subtle parallax depth layer behind the hero. Purely decorative
 * (pointer-events off) and frozen under prefers-reduced-motion.
 */

type Orb = {
  /** left / top as CSS percentages within the layer. */
  left: string;
  top: string;
  size: number; // px
  color: string;
  /** Parallax speed — px moved per px scrolled (negative = drifts up). */
  speed: number;
  opacity: number;
};

const ORBS: Orb[] = [
  { left: "6%", top: "18%", size: 190, color: "#e7c7cf", speed: -0.18, opacity: 0.5 },
  { left: "78%", top: "10%", size: 240, color: "#e8d3a2", speed: -0.32, opacity: 0.45 },
  { left: "60%", top: "62%", size: 150, color: "#cdd8c6", speed: -0.12, opacity: 0.45 },
  { left: "28%", top: "70%", size: 120, color: "#d9c3e0", speed: -0.24, opacity: 0.4 },
  { left: "42%", top: "24%", size: 90, color: "#f0dcc4", speed: -0.4, opacity: 0.4 },
];

export function ParallaxBeads() {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const y = window.scrollY;
      for (let i = 0; i < refs.current.length; i++) {
        const el = refs.current[i];
        const orb = ORBS[i];
        if (el && orb) el.style.transform = `translate3d(0, ${y * orb.speed}px, 0)`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {ORBS.map((orb, i) => (
        <span
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="absolute rounded-full blur-3xl will-change-transform"
          style={{
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            opacity: orb.opacity,
            background: `radial-gradient(circle at 35% 30%, ${orb.color}, transparent 70%)`,
          }}
        />
      ))}
    </div>
  );
}
