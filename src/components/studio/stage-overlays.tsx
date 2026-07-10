"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { useStudioStore } from "@/lib/studio/store";
import { indexCatalog, resolveComponent } from "@/lib/studio/derive";
import type { StudioCatalog } from "@/lib/studio/types";

/**
 * The delete bin: appears only while a bead/charm is being dragged. Drag a
 * component onto it and release to remove it. Hit-testing is done by rect in
 * the drag handler (via the `studio-trash` id), so this stays pointer-transparent.
 */
export function DeleteBin() {
  const dragging = useStudioStore((s) => s.draggingUid !== null);
  const over = useStudioStore((s) => s.dragOverTrash);

  if (!dragging) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
      <div
        id="studio-trash"
        className={cn(
          "flex items-center gap-2 rounded-full border px-5 py-3 shadow-lift backdrop-blur transition-all duration-200",
          over
            ? "scale-110 border-destructive bg-destructive text-destructive-foreground"
            : "border-border bg-card/95 text-ink-soft"
        )}
      >
        <Trash2 className="size-5" aria-hidden />
        <span className="text-sm font-medium">
          {over ? "Release to remove" : "Drag here to remove"}
        </span>
      </div>
    </div>
  );
}

/**
 * On-canvas overlays for the selected component: a stone-info card (the
 * lifestyle layer — name, meaning, price) and a floating remove button.
 * Editing is done by hand on the bracelet, so there is no side edit panel.
 */
export function StageOverlays({ catalog }: { catalog: StudioCatalog }) {
  const index = useMemo(() => indexCatalog(catalog), [catalog]);
  const selectedUid = useStudioStore((s) => s.selectedUid);
  const components = useStudioStore((s) => s.components);
  const remove = useStudioStore((s) => s.removeComponent);
  const dragging = useStudioStore((s) => s.draggingUid !== null);

  const selected = useMemo(() => {
    const comp = components.find((c) => c.uid === selectedUid);
    return comp ? resolveComponent(index, comp) : null;
  }, [components, selectedUid, index]);

  // While dragging, show only the delete bin — hide the info card/remove button.
  if (!selected || dragging) return <DeleteBin />;

  return (
    <>
      <DeleteBin />
      <div className="pointer-events-none absolute bottom-4 left-4 max-w-[16rem]">
        <div className="pointer-events-auto rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-soft backdrop-blur">
          <div className="flex items-center gap-2">
            <span
              className="size-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: selected.colorHex }}
              aria-hidden
            />
            <p className="text-sm font-medium text-ink">{selected.name}</p>
            <span className="ml-auto text-xs text-ink-soft">
              {formatPrice(selected.priceInPiastres)}
            </span>
          </div>
          {selected.meaning && (
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
              {selected.meaning}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => remove(selected.uid)}
        aria-label={`Remove ${selected.name}`}
        title="Remove selected"
        className="absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full border border-border bg-card text-destructive shadow-lift transition-colors hover:bg-destructive/10"
      >
        <Trash2 className="size-5" aria-hidden />
      </button>
    </>
  );
}
