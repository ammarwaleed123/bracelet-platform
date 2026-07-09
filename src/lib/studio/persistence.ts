import type { CatalogIndex } from "@/lib/studio/derive";
import type { StudioDesignState } from "@/lib/studio/types";
import { DEFAULT_SIZE_CM, MAX_SIZE_CM, MIN_SIZE_CM } from "@/lib/studio/store";

const DRAFT_KEY = "aurelia.studio.draft.v1";

/** Read the autosaved draft, dropping any component whose catalog item no
 * longer exists (e.g. it was removed in admin since the draft was saved). */
export function loadDraft(index: CatalogIndex): StudioDesignState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StudioDesignState;
    return sanitizeDraft(parsed, index);
  } catch {
    return null;
  }
}

export function saveDraft(state: StudioDesignState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked — autosave is best-effort.
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

function sanitizeDraft(
  draft: StudioDesignState,
  index: CatalogIndex
): StudioDesignState | null {
  if (!draft || typeof draft !== "object") return null;

  const baseId =
    draft.baseId && index.bases.has(draft.baseId) ? draft.baseId : null;

  const sizeCm =
    typeof draft.sizeCm === "number"
      ? Math.min(MAX_SIZE_CM, Math.max(MIN_SIZE_CM, draft.sizeCm))
      : DEFAULT_SIZE_CM;

  const components = Array.isArray(draft.components)
    ? draft.components.filter(
        (c) =>
          c &&
          typeof c.uid === "string" &&
          (c.kind === "bead" || c.kind === "charm") &&
          (c.kind === "bead"
            ? index.beads.has(c.refId)
            : index.charms.has(c.refId))
      )
    : [];

  return { baseId, sizeCm, components };
}
