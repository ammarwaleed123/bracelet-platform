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
import { BaseSelector, PriceChip, SizeControl, Toolbar } from "./controls";
import { SaveDesign } from "./save-design";
import { AddToCartStudio } from "./add-to-cart-studio";
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
    // Mobile: normal page scroll with the stage pinned like the navbar (sticky),
    // so the bracelet is always visible while the palette scrolls beneath it.
    // Desktop: a fixed-height two-column split with an internally-scrolling panel.
    <div className="lg:flex lg:h-[calc(100dvh-4rem)] lg:flex-row">
      {/* Stage — sticky below the 4rem header on mobile, static column on desktop.
          svh (not dvh) keeps the height stable when the mobile URL bar hides on
          scroll. Same cream as the palette so there's no seam between them. */}
      <div className="sticky top-16 z-10 h-[45svh] w-full bg-cream lg:relative lg:top-auto lg:z-auto lg:h-full lg:min-w-0 lg:flex-1">
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

      {/* Control panel — flows as normal page content on mobile (page scrolls
          under the pinned stage); a fixed-width, internally-scrolling rail on
          desktop. */}
      <aside className="w-full bg-background lg:flex lg:h-full lg:w-[380px] lg:flex-col lg:border-l lg:border-border">
        <div className="space-y-5 p-5 lg:shrink-0">
          <div className="flex items-center justify-between gap-3">
            <p className="font-serif text-lg text-ink">Design</p>
            <div className="flex items-center gap-2">
              <SaveDesign catalog={catalog} />
              <AddToCartStudio catalog={catalog} />
            </div>
          </div>
          <BaseSelector catalog={catalog} />
          <SizeControl catalog={catalog} />
        </div>
        <div className="p-5 pt-0 lg:min-h-0 lg:flex-1 lg:overflow-hidden lg:border-t lg:border-border lg:pt-5">
          <Palette catalog={catalog} />
        </div>
      </aside>
    </div>
  );
}
