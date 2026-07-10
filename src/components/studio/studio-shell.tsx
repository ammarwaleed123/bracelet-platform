"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { nanoid } from "nanoid";
import { X } from "lucide-react";

import { useStudioStore } from "@/lib/studio/store";
import { indexCatalog } from "@/lib/studio/derive";
import { loadDraft, saveDraft } from "@/lib/studio/persistence";
import { buildStarterDesign } from "@/lib/studio/starter";
import type { StudioLoadDesign } from "@/lib/designs/queries";
import type { StudioCatalog, StudioDesignState } from "@/lib/studio/types";
import { Palette } from "./palette";
import { BaseSelector, ClearAllButton, PriceChip, SizeControl, Toolbar } from "./controls";
import { SaveDesign } from "./save-design";
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

export function StudioShell({
  catalog,
  initial,
}: {
  catalog: StudioCatalog;
  initial?: StudioLoadDesign;
}) {
  const [ready, setReady] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const initialized = useRef(false);

  // Initialize: an opened/forked design (if any), else the autosaved draft,
  // else an empty starter on first visit.
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (initial) {
      useStudioStore.getState().loadDesign(
        {
          baseId: initial.baseId,
          sizeCm: initial.sizeCm,
          components: initial.components.map((c) => ({
            uid: nanoid(8),
            kind: c.kind,
            refId: c.refId,
          })),
        },
        {
          savedDesignId: initial.ownedDesignId,
          forkedFromId: initial.forkFromId,
          designName: initial.name,
        }
      );
      setReady(true);
      return;
    }

    const index = indexCatalog(catalog);
    const draft = loadDraft(index);
    if (draft && (draft.components.length > 0 || draft.baseId)) {
      useStudioStore.getState().hydrate(draft);
    } else {
      useStudioStore.getState().hydrate(buildStarterDesign(catalog));
      setShowHint(true);
    }
    setReady(true);
  }, [catalog, initial]);

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
    // Fixed-height split on every screen so the bracelet stays pinned while the
    // palette scrolls under it — on mobile you no longer scroll the stage away.
    <div className="flex h-[calc(100dvh-4rem)] flex-col lg:flex-row">
      {/* Stage */}
      <div className="relative h-[48dvh] w-full shrink-0 lg:h-full lg:min-w-0 lg:flex-1">
        {ready ? <BraceletCanvas catalog={catalog} /> : <StudioLoading />}

        {/* Toolbar overlay */}
        <div className="absolute left-3 top-3">
          <div className="rounded-full border border-border bg-background/85 p-1 shadow-soft backdrop-blur">
            <Toolbar />
          </div>
        </div>

        {/* Live price overlay — top-right so it never overlaps the toolbar */}
        <div className="absolute right-3 top-3">
          <PriceChip catalog={catalog} />
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

      {/* Control panel — takes the remaining height and scrolls the palette
          internally; fixed-width rail on desktop. */}
      <aside className="flex min-h-0 w-full flex-1 flex-col border-t border-border bg-background lg:h-full lg:w-[380px] lg:flex-none lg:border-l lg:border-t-0">
        <div className="shrink-0 space-y-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-serif text-lg text-ink">Design</p>
            <div className="flex items-center gap-3">
              <ClearAllButton />
              <SaveDesign catalog={catalog} />
            </div>
          </div>
          <BaseSelector catalog={catalog} />
          <SizeControl catalog={catalog} />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden border-t border-border p-5">
          <Palette catalog={catalog} />
        </div>
      </aside>
    </div>
  );
}
