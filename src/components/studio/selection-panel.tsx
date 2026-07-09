"use client";

import { useMemo } from "react";
import { ArrowLeft, ArrowRight, Copy, Trash2 } from "lucide-react";

import { formatPrice } from "@/lib/utils";
import { useStudioStore } from "@/lib/studio/store";
import { indexCatalog, resolveComponent } from "@/lib/studio/derive";
import type { StudioCatalog } from "@/lib/studio/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function SelectionPanel({ catalog }: { catalog: StudioCatalog }) {
  const index = useMemo(() => indexCatalog(catalog), [catalog]);
  const selectedUid = useStudioStore((s) => s.selectedUid);
  const components = useStudioStore((s) => s.components);

  const remove = useStudioStore((s) => s.removeComponent);
  const duplicate = useStudioStore((s) => s.duplicateComponent);
  const move = useStudioStore((s) => s.moveComponent);
  const replace = useStudioStore((s) => s.replaceComponent);

  const selected = useMemo(() => {
    const comp = components.find((c) => c.uid === selectedUid);
    return comp ? resolveComponent(index, comp) : null;
  }, [components, selectedUid, index]);

  if (!selected) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-ink-soft">
        Tap a bead or charm on the bracelet to replace, duplicate, move, or
        remove it.
      </p>
    );
  }

  const options = selected.kind === "bead" ? catalog.beads : catalog.charms;
  const index0 = components.findIndex((c) => c.uid === selected.uid);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <span
          className="size-8 shrink-0 rounded-lg border border-border"
          style={{ backgroundColor: selected.colorHex }}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">
            {selected.name}
          </p>
          <p className="text-xs text-ink-soft">
            {formatPrice(selected.priceInPiastres)}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <label className="label-caps mb-1 block" htmlFor="replace-with">
          Replace with
        </label>
        <Select
          id="replace-with"
          value={selected.refId}
          onChange={(e) =>
            replace(selected.uid, selected.kind, e.target.value)
          }
          className="h-10"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id} disabled={o.stockQuantity <= 0}>
              {o.name}
              {o.stockQuantity <= 0 ? " (out of stock)" : ""}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => move(selected.uid, -1)}
          disabled={index0 <= 0}
        >
          <ArrowLeft aria-hidden /> Move
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => move(selected.uid, 1)}
          disabled={index0 >= components.length - 1}
        >
          Move <ArrowRight aria-hidden />
        </Button>
        <Button variant="outline" size="sm" onClick={() => duplicate(selected.uid)}>
          <Copy aria-hidden /> Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => remove(selected.uid)}
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <Trash2 aria-hidden /> Remove
        </Button>
      </div>
    </div>
  );
}
