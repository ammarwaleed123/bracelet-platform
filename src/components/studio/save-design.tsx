"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

import { useStudioStore } from "@/lib/studio/store";
import { indexCatalog, resolveComponents } from "@/lib/studio/derive";
import { suggestDesignName } from "@/lib/studio/naming";
import { captureThumbnail } from "@/lib/studio/capture";
import { publishDesign, saveDesign } from "@/lib/designs/actions";
import type { StudioCatalog } from "@/lib/studio/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SaveDesign({ catalog }: { catalog: StudioCatalog }) {
  const index = useMemo(() => indexCatalog(catalog), [catalog]);
  const [open, setOpen] = useState(false);

  const components = useStudioStore((s) => s.components);
  const hasComponents = components.length > 0;

  return (
    <>
      <Button
        size="sm"
        disabled={!hasComponents}
        onClick={() => setOpen(true)}
        title={hasComponents ? "Save this design" : "Add a stone first"}
      >
        Save design
      </Button>
      {open && <SaveDialog catalog={catalog} index={index} onClose={() => setOpen(false)} />}
    </>
  );
}

function SaveDialog({
  catalog,
  index,
  onClose,
}: {
  catalog: StudioCatalog;
  index: ReturnType<typeof indexCatalog>;
  onClose: () => void;
}) {
  const baseId = useStudioStore((s) => s.baseId);
  const sizeCm = useStudioStore((s) => s.sizeCm);
  const components = useStudioStore((s) => s.components);
  const savedDesignId = useStudioStore((s) => s.savedDesignId);
  const forkedFromId = useStudioStore((s) => s.forkedFromId);
  const existingName = useStudioStore((s) => s.designName);
  const setSaveMeta = useStudioStore((s) => s.setSaveMeta);

  const suggestion = useMemo(() => {
    const names = resolveComponents(index, components).map((c) => c.name);
    return existingName ?? suggestDesignName(names);
  }, [index, components, existingName]);

  const [name, setName] = useState(suggestion);
  const [displayName, setDisplayName] = useState("");
  const [showName, setShowName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ id: string; publicId: string } | null>(null);
  const [submittedToGallery, setSubmittedToGallery] = useState(false);
  const [pending, startTransition] = useTransition();

  const onSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveDesign({
        designId: savedDesignId ?? undefined,
        forkedFromDesignId: forkedFromId ?? undefined,
        name,
        baseId,
        sizeCm,
        components: components.map((c) => ({ kind: c.kind, refId: c.refId })),
        thumbnailDataUrl: captureThumbnail() ?? undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaveMeta({ savedDesignId: result.id, designName: name });
      setSaved({ id: result.id, publicId: result.publicId });
    });
  };

  const onPublish = () => {
    if (!saved) return;
    startTransition(async () => {
      await publishDesign(saved.id, showName ? displayName : undefined);
      setSubmittedToGallery(true);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl text-ink">
            {saved ? "Design saved" : "Name your design"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink-soft hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>

        {!saved ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="design-name" className="label-caps block">
                Name
              </label>
              <Input
                id="design-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                autoFocus
              />
              <p className="text-xs text-ink-soft">
                We suggested one from your stones — make it yours.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={pending || !name.trim()}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : submittedToGallery ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-gold-tint text-gold-strong">
              <Check className="size-6" />
            </div>
            <p className="text-sm text-ink-soft">
              Submitted to the gallery — it will appear once our team approves
              it. Thank you for sharing your design!
            </p>
            <Button onClick={onClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              Saved to your account. Share it, or add it to the community
              gallery.
            </p>
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-linen p-3">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={showName}
                  onChange={(e) => setShowName(e.target.checked)}
                  className="size-4 accent-gold"
                />
                Show my name on the gallery
              </label>
              {showName && (
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  maxLength={40}
                  className="h-9"
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline">
                <Link href={`/design/${saved.publicId}`}>View & share</Link>
              </Button>
              <Button onClick={onPublish} disabled={pending}>
                {pending ? "Submitting…" : "Add to gallery"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
