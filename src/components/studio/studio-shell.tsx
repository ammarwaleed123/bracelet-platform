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
import {
  BaseSelector,
  PriceChip,
  SizeControl,
  Toolbar,
} from "./controls";
import { SelectionPanel } from "./selection-panel";
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
    <div className="flex h-[calc(100dvh-4rem)] flex-col lg:flex-row">
      {/* Stage */}
      <div className="relative min-h-[45dvh] flex-1 lg:min-h-0">
        {ready ? <BraceletCanvas catalog={catalog} /> : <StudioLoading />}

        {/* Toolbar overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="pointer-events-auto rounded-full border border-border bg-background/85 p-1 shadow-soft backdrop-blur">
            <Toolbar />
          </div>
        </div>

        {/* Live price overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4">
          <div className="pointer-events-auto">
            <PriceChip catalog={catalog} />
          </div>
        </div>

        {/* First-run hint */}
        {showHint && (
          <div className="absolute left-3 top-16 max-w-[15rem] rounded-2xl border border-border bg-card/95 p-4 shadow-lift backdrop-blur">
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
              Add stones from the palette, drag beads on the bracelet to
              rearrange, and tap one to edit it.
            </p>
          </div>
        )}
      </div>

      {/* Control panel */}
      <aside className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-t border-border bg-background p-5 lg:w-[380px] lg:border-l lg:border-t-0">
        <BaseSelector catalog={catalog} />
        <SizeControl catalog={catalog} />
        <SelectionPanel catalog={catalog} />
        <div className="min-h-0 flex-1">
          <Palette catalog={catalog} />
        </div>
      </aside>
    </div>
  );
}
