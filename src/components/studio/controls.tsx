"use client";

import { useMemo } from "react";
import { Focus, Redo2, Undo2 } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import {
  MAX_SIZE_CM,
  MIN_SIZE_CM,
  useStudioStore,
} from "@/lib/studio/store";
import {
  circumferenceMm,
  computePriceInPiastres,
  indexCatalog,
  usedLengthMm,
} from "@/lib/studio/derive";
import type { StudioCatalog } from "@/lib/studio/types";
import { Button } from "@/components/ui/button";

export function BaseSelector({ catalog }: { catalog: StudioCatalog }) {
  const baseId = useStudioStore((s) => s.baseId);
  const setBase = useStudioStore((s) => s.setBase);

  return (
    <div>
      <p className="label-caps mb-2">Base</p>
      <div className="flex flex-wrap gap-1.5">
        {catalog.bases.map((base) => {
          const out = base.stockQuantity <= 0;
          return (
            <button
              key={base.id}
              type="button"
              disabled={out}
              onClick={() => setBase(base.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors",
                base.id === baseId
                  ? "border-gold bg-gold-tint text-gold-strong"
                  : "border-border text-ink-soft hover:bg-sand",
                out && "cursor-not-allowed opacity-50"
              )}
              title={out ? "Out of stock" : undefined}
            >
              <span
                className="size-3 rounded-full border border-black/10"
                style={{ backgroundColor: base.colorHex }}
                aria-hidden
              />
              {base.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SizeControl({ catalog }: { catalog: StudioCatalog }) {
  const index = useMemo(() => indexCatalog(catalog), [catalog]);
  const sizeCm = useStudioStore((s) => s.sizeCm);
  const components = useStudioStore((s) => s.components);
  const setSize = useStudioStore((s) => s.setSize);

  const used = usedLengthMm(index, components);
  const total = circumferenceMm(sizeCm);
  const pct = Math.min(100, Math.round((used / total) * 100));
  const full = used >= total;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="label-caps">Wrist size</p>
        <p className="text-sm text-ink">{sizeCm.toFixed(1)} cm</p>
      </div>
      <input
        type="range"
        min={MIN_SIZE_CM}
        max={MAX_SIZE_CM}
        step={0.5}
        value={sizeCm}
        onChange={(e) => setSize(Number(e.target.value))}
        aria-label="Wrist size in centimeters"
        className="w-full accent-gold"
      />
      <div className="mt-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              full ? "bg-destructive" : "bg-gold"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-ink-soft">
          {full
            ? "Bracelet is full at this size."
            : `${(used / 10).toFixed(1)} of ${(total / 10).toFixed(1)} cm filled`}
        </p>
      </div>
    </div>
  );
}

export function PriceChip({ catalog }: { catalog: StudioCatalog }) {
  const index = useMemo(() => indexCatalog(catalog), [catalog]);
  const baseId = useStudioStore((s) => s.baseId);
  const components = useStudioStore((s) => s.components);

  const price = computePriceInPiastres(index, baseId, components);

  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-card px-4 py-2 shadow-soft">
      <span className="label-caps">Total</span>
      <span className="font-serif text-lg text-ink">{formatPrice(price)}</span>
      <span className="text-xs text-ink-soft">
        {components.length} {components.length === 1 ? "piece" : "pieces"}
      </span>
    </div>
  );
}

export function Toolbar() {
  const canUndo = useStudioStore((s) => s.past.length > 0);
  const canRedo = useStudioStore((s) => s.future.length > 0);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const requestCameraReset = useStudioStore((s) => s.requestCameraReset);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={undo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Redo"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={requestCameraReset}
        aria-label="Front view"
        title="Reset to front view"
      >
        <Focus aria-hidden />
      </Button>
    </div>
  );
}

/** Text button to clear the whole design, shown in the control panel. */
export function ClearAllButton() {
  const hasComponents = useStudioStore((s) => s.components.length > 0);
  const clearAll = useStudioStore((s) => s.clearAll);
  if (!hasComponents) return null;
  return (
    <button
      type="button"
      onClick={clearAll}
      className="text-xs text-ink-soft underline-offset-2 transition-colors hover:text-destructive hover:underline"
    >
      Start over
    </button>
  );
}
