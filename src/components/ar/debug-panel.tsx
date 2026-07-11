"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { AR_TUNING } from "@/lib/ar/pose";

type Key = keyof typeof AR_TUNING;

const FIELDS: { key: Key; label: string; min: number; max: number; step: number }[] =
  [
    { key: "smoothingMinCutoff", label: "Smoothing (min cutoff)", min: 0.2, max: 4, step: 0.1 },
    { key: "smoothingBeta", label: "Smoothing (beta)", min: 0, max: 0.2, step: 0.005 },
    { key: "scaleMultiplier", label: "Scale multiplier", min: 0.1, max: 1.2, step: 0.02 },
    { key: "ringTiltOffsetDeg", label: "Ring tilt (deg)", min: 0, max: 90, step: 1 },
    { key: "depthResponse", label: "Depth response", min: 0, max: 1.2, step: 0.05 },
    { key: "anchorForearmShift", label: "Anchor shift", min: -0.3, max: 0.5, step: 0.02 },
    { key: "occluderRadiusFactor", label: "Wrist cover", min: 0.4, max: 1.1, step: 0.02 },
    { key: "detectionFps", label: "Detection FPS", min: 12, max: 60, step: 1 },
  ];

/** Hidden tuning panel (opened with ?debug=1). Writes straight into the mutable
 *  AR_TUNING object, which the render + detection loops read every tick — so
 *  every change is felt live on the device. */
export function DebugPanel({ onClose }: { onClose: () => void }) {
  // Local mirror just to re-render the slider thumbs; AR_TUNING is the source.
  const [, force] = useState(0);

  return (
    <div className="pointer-events-auto absolute bottom-4 left-4 z-30 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-background/90 p-4 shadow-lift backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <p className="label-caps text-ink-soft">Tuning</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close tuning panel"
          className="text-ink-soft hover:text-ink"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="flex justify-between text-xs text-ink-soft">
              {f.label}
              <span className="tabular-nums text-ink">
                {AR_TUNING[f.key].toFixed(f.step < 1 ? 3 : 0)}
              </span>
            </span>
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={AR_TUNING[f.key]}
              onChange={(e) => {
                AR_TUNING[f.key] = Number(e.target.value);
                force((n) => n + 1);
              }}
              className="mt-1 w-full accent-gold"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
