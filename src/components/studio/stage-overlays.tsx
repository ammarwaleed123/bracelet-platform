"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import { useStudioStore } from "@/lib/studio/store";
import { indexCatalog, resolveComponent } from "@/lib/studio/derive";
import type { StudioCatalog } from "@/lib/studio/types";

/**
 * On-canvas overlays for the selected component: a stone-info card (the
 * lifestyle layer — name, meaning, price) and a floating remove bin. The bin
 * doubles as a drag target: drag a bead/charm onto it and release to delete it
 * (hit-tested by rect in the drag handler via the `studio-trash` id).
 * Editing is done by hand on the bracelet, so there is no side edit panel.
 */
export function StageOverlays({ catalog }: { catalog: StudioCatalog }) {
  const index = useMemo(() => indexCatalog(catalog), [catalog]);
  const selectedUid = useStudioStore((s) => s.selectedUid);
  const components = useStudioStore((s) => s.components);
  const remove = useStudioStore((s) => s.removeComponent);
  const dragging = useStudioStore((s) => s.draggingUid !== null);
  const overTrash = useStudioStore((s) => s.dragOverTrash);

  const selected = useMemo(() => {
    const comp = components.find((c) => c.uid === selectedUid);
    return comp ? resolveComponent(index, comp) : null;
  }, [components, selectedUid, index]);

  if (!selected) return null;

  return (
    <>
      {/* Info card — hidden mid-drag to keep the stage calm. */}
      {!dragging && (
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
      )}

      {/* Remove bin — click to remove the selected component, or drag one onto
          it and release. Grows and turns red while a drag hovers it. */}
      <button
        id="studio-trash"
        type="button"
        onClick={() => remove(selected.uid)}
        aria-label={`Remove ${selected.name}`}
        title="Remove — or drag a bead here"
        className={cn(
          "absolute bottom-4 right-4 flex size-12 items-center justify-center rounded-full border shadow-lift transition-all duration-200",
          overTrash
            ? "scale-125 border-destructive bg-destructive text-destructive-foreground"
            : "border-border bg-card text-destructive hover:bg-destructive/10"
        )}
      >
        <Trash2 className="size-5" aria-hidden />
      </button>
    </>
  );
}
