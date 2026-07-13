"use client";

import { useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";

import { formatPrice } from "@/lib/utils";
import { saveDraft } from "@/lib/studio/persistence";
import { saveDesign } from "@/lib/designs/actions";
import { addStudioDesignToCart } from "@/lib/cart/actions";
import type { DesignConcept } from "@/lib/ai/types";
import type { StudioCatalog, StudioDesignState } from "@/lib/studio/types";
import { Button } from "@/components/ui/button";
import { designer } from "@/content/designer";

const BraceletPreview = dynamic(
  () =>
    import("@/components/studio/scene/bracelet-preview").then(
      (m) => m.BraceletPreview
    ),
  { ssr: false, loading: () => <div className="size-full animate-pulse bg-sand/40" /> }
);

/** One AI concept: a live 3D preview + name/story/price + actions. */
export function ConceptCard({
  concept,
  catalog,
}: {
  concept: DesignConcept;
  catalog: StudioCatalog;
}) {
  const router = useRouter();
  const design: StudioDesignState = useMemo(
    () => ({
      baseId: concept.baseId,
      sizeCm: concept.sizeCm,
      components: concept.components.map((c) => ({
        uid: nanoid(8),
        kind: c.kind,
        refId: c.refId,
      })),
    }),
    [concept]
  );

  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const openInStudio = () => {
    saveDraft(design);
    router.push("/studio");
  };

  const save = () =>
    start(async () => {
      setError(null);
      const res = await saveDesign({
        name: concept.name,
        baseId: concept.baseId,
        sizeCm: concept.sizeCm,
        components: concept.components,
        source: "ai_designer",
      });
      if (res.ok) setSaved(true);
      else setError(res.error);
    });

  const addToCart = () =>
    start(async () => {
      setError(null);
      const res = await addStudioDesignToCart({
        name: concept.name,
        baseId: concept.baseId,
        sizeCm: concept.sizeCm,
        components: concept.components,
        source: "ai_designer",
      });
      if (res.ok) {
        setAdded(true);
        router.refresh();
      } else setError(res.error);
    });

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="relative aspect-square bg-gradient-to-b from-white to-linen">
        <BraceletPreview catalog={catalog} design={design} />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-serif text-lg text-ink">{concept.name}</h3>
          <span className="shrink-0 text-sm text-ink-soft">
            {formatPrice(concept.priceInPiastres)}
          </span>
        </div>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">
          {concept.story}
        </p>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        <div className="mt-4 space-y-2">
          <Button onClick={openInStudio} className="w-full">
            {designer.results.openInStudio}
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={save}
              disabled={pending || saved}
              className="w-full"
            >
              {saved ? designer.results.saved : designer.results.save}
            </Button>
            <Button
              variant="outline"
              onClick={addToCart}
              disabled={pending || added}
              className="w-full"
            >
              {added ? designer.results.added : designer.results.addToCart}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
