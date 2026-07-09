"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";

import { useStudioStore } from "@/lib/studio/store";
import { indexCatalog } from "@/lib/studio/derive";
import { loadDraft, saveDraft } from "@/lib/studio/persistence";
import { buildStarterDesign } from "@/lib/studio/starter";
import type { StudioCatalog, StudioDesignState } from "@/lib/studio/types";
import { Palette } from "./palette";
import { BaseSelector, ClearAllButton, PriceChip, SizeControl, Toolbar } from "./controls";
import { StageOverlays } from "./stage-overlays";
import { StudioLoading } from "./studio-loading";

// The 3D bundle is heavy — load it only on the client with a branded fallback.
const BraceletCanvas = dynamic(
  () => import("./scene/bracelet-canvas").then((m) => m.BraceletCanvas),
  { ssr: false, loading: () => <StudioLoading /> }
);

function isFormField(el: EventTarget | null) {
  return (
    el instanceof HTMLElement &&
    ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
  );
}

export function StudioShell({ catalog }: { catalog: StudioCatalog }) {
  const [ready, setReady] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const initialized = useRef(false);

  // Initialize from the autosaved draft, or a starter bracelet on first visit.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const index = indexCatalog(catalog);
    const draft = loadDraft(index);
    if (draft && (draft.components.length > 0 || draft.baseId)) {
      useStudioStore.getState().hydrate(draft);
    } else {
      useStudioStore.getState().hydrate(buildStarterDesign(catalog));
      setShowHint(true);
    }
    setReady(true);
  }, [catalog]);

  // Debounced autosave of the design to localStorage.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const unsub = useStudioStore.subscribe((s) => {
      const state: StudioDesignState = {
        baseId: s.baseId,
        sizeCm: s.sizeCm,
        components: s.components,
      };
      clearTimeout(timer);
      timer = setTimeout(() => saveDraft(state), 500);
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);

  // Undo/redo keyboard shortcuts (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || isFormField(e.target)) return;
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) useStudioStore.getState().redo();
        else useStudioStore.getState().undo();
      } else if (key === "y") {
        e.preventDefault();
        useStudioStore.getState().redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-4rem)] lg:flex-row">
      {/* Stage */}
      <div className="relative h-[55dvh] w-full shrink-0 lg:h-full lg:min-w-0 lg:flex-1">
        {ready ? <BraceletCanvas catalog={catalog} /> : <StudioLoading />}

        {/* Toolbar overlay */}
        <div className="absolute left-3 top-3">
          <div className="rounded-full border border-border bg-background/85 p-1 shadow-soft backdrop-blur">
            <Toolbar />
          </div>
        </div>

        {/* Live price overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
          <div className="pointer-events-auto">
            <PriceChip catalog={catalog} />
          </div>
        </div>

        {/* First-run hint */}
        {showHint && (
          <div className="absolute left-3 top-20 max-w-[15rem] rounded-2xl border border-border bg-card/95 p-4 shadow-lift backdrop-blur">
            <button
              type="button"
              onClick={() => setShowHint(false)}
              aria-label="Dismiss hint"
              className="absolute right-2 top-2 text-ink-soft hover:text-ink"
            >
              <X className="size-4" aria-hidden />
            </button>
            <p className="font-serif text-base text-ink">Make it yours</p>
            <p className="mt-1 text-sm text-ink-soft">
              Add stones from the palette, then drag beads around the bracelet
              with your finger to arrange them. Tap a bead to see its meaning or
              remove it.
            </p>
          </div>
        )}

        <StageOverlays catalog={catalog} />
      </div>

      {/* Control panel */}
      <aside className="flex w-full shrink-0 flex-col border-t border-border bg-background lg:h-full lg:w-[380px] lg:border-l lg:border-t-0">
        <div className="shrink-0 space-y-5 p-5">
          <div className="flex items-center justify-between">
            <BaseSelectorHeading />
            <ClearAllButton />
          </div>
          <BaseSelector catalog={catalog} />
          <SizeControl catalog={catalog} />
        </div>
        <div className="min-h-0 flex-1 border-t border-border p-5 lg:overflow-hidden">
          <Palette catalog={catalog} />
        </div>
      </aside>
    </div>
  );
}

function BaseSelectorHeading() {
  return <p className="font-serif text-lg text-ink">Design</p>;
}
