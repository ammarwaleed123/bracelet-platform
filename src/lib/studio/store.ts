import { create } from "zustand";
import { nanoid } from "nanoid";

import type { PlacedComponent, StudioDesignState } from "@/lib/studio/types";

const MAX_HISTORY = 50;

export const MIN_SIZE_CM = 14;
export const MAX_SIZE_CM = 22;
export const DEFAULT_SIZE_CM = 18;

type StudioState = StudioDesignState & {
  selectedUid: string | null;
  past: StudioDesignState[];
  future: StudioDesignState[];
  /** Bumping this signals the scene to reset the camera to the front view. */
  cameraResetNonce: number;
};

type StudioActions = {
  hydrate: (state: StudioDesignState) => void;
  getDesignState: () => StudioDesignState;
  setBase: (baseId: string) => void;
  setSize: (sizeCm: number) => void;
  addComponent: (kind: "bead" | "charm", refId: string) => void;
  removeComponent: (uid: string) => void;
  duplicateComponent: (uid: string) => void;
  replaceComponent: (uid: string, kind: "bead" | "charm", refId: string) => void;
  moveComponent: (uid: string, direction: -1 | 1) => void;
  /** Live reorder during a drag — intentionally does NOT record history. */
  moveLive: (uid: string, targetIndex: number) => void;
  /** Record a single history step for a completed drag interaction. */
  commitInteraction: (before: StudioDesignState) => void;
  select: (uid: string | null) => void;
  undo: () => void;
  redo: () => void;
  clearAll: () => void;
  requestCameraReset: () => void;
};

export type StudioStore = StudioState & StudioActions;

const snap = (s: StudioState): StudioDesignState => ({
  baseId: s.baseId,
  sizeCm: s.sizeCm,
  components: s.components,
});

const sameDesign = (a: StudioDesignState, b: StudioDesignState) =>
  a.baseId === b.baseId &&
  a.sizeCm === b.sizeCm &&
  a.components.length === b.components.length &&
  a.components.every((c, i) => c.uid === b.components[i]?.uid);

/** Reducer that records the pre-change snapshot into the undo stack. */
function withHistory(
  s: StudioState,
  changes: Partial<StudioState>
): Partial<StudioState> {
  const past = [...s.past, snap(s)].slice(-MAX_HISTORY);
  return { ...changes, past, future: [] };
}

export const useStudioStore = create<StudioStore>((set, get) => ({
  baseId: null,
  sizeCm: DEFAULT_SIZE_CM,
  components: [],
  selectedUid: null,
  past: [],
  future: [],
  cameraResetNonce: 0,

  hydrate: (state) =>
    set({
      baseId: state.baseId,
      sizeCm: state.sizeCm,
      components: state.components,
      selectedUid: null,
      past: [],
      future: [],
    }),

  getDesignState: () => snap(get()),

  setBase: (baseId) => set((s) => withHistory(s, { baseId })),

  setSize: (sizeCm) =>
    set((s) => {
      const clamped = Math.min(MAX_SIZE_CM, Math.max(MIN_SIZE_CM, sizeCm));
      if (clamped === s.sizeCm) return {};
      return withHistory(s, { sizeCm: clamped });
    }),

  addComponent: (kind, refId) =>
    set((s) => {
      const comp: PlacedComponent = { uid: nanoid(8), kind, refId };
      const selIndex = s.selectedUid
        ? s.components.findIndex((c) => c.uid === s.selectedUid)
        : -1;
      const components =
        selIndex >= 0
          ? [
              ...s.components.slice(0, selIndex + 1),
              comp,
              ...s.components.slice(selIndex + 1),
            ]
          : [...s.components, comp];
      return withHistory(s, { components, selectedUid: comp.uid });
    }),

  removeComponent: (uid) =>
    set((s) =>
      withHistory(s, {
        components: s.components.filter((c) => c.uid !== uid),
        selectedUid: s.selectedUid === uid ? null : s.selectedUid,
      })
    ),

  duplicateComponent: (uid) =>
    set((s) => {
      const index = s.components.findIndex((c) => c.uid === uid);
      if (index < 0) return {};
      const source = s.components[index]!;
      const copy: PlacedComponent = { ...source, uid: nanoid(8) };
      const components = [
        ...s.components.slice(0, index + 1),
        copy,
        ...s.components.slice(index + 1),
      ];
      return withHistory(s, { components, selectedUid: copy.uid });
    }),

  replaceComponent: (uid, kind, refId) =>
    set((s) => {
      const index = s.components.findIndex((c) => c.uid === uid);
      if (index < 0) return {};
      const components = [...s.components];
      components[index] = { uid, kind, refId };
      return withHistory(s, { components });
    }),

  moveComponent: (uid, direction) =>
    set((s) => {
      const index = s.components.findIndex((c) => c.uid === uid);
      if (index < 0) return {};
      const target = index + direction;
      if (target < 0 || target >= s.components.length) return {};
      const components = [...s.components];
      const [moved] = components.splice(index, 1);
      components.splice(target, 0, moved!);
      return withHistory(s, { components });
    }),

  moveLive: (uid, targetIndex) =>
    set((s) => {
      const index = s.components.findIndex((c) => c.uid === uid);
      if (index < 0 || index === targetIndex) return {};
      const clamped = Math.min(
        s.components.length - 1,
        Math.max(0, targetIndex)
      );
      if (clamped === index) return {};
      const components = [...s.components];
      const [moved] = components.splice(index, 1);
      components.splice(clamped, 0, moved!);
      return { components };
    }),

  commitInteraction: (before) =>
    set((s) => {
      if (sameDesign(before, snap(s))) return {};
      return { past: [...s.past, before].slice(-MAX_HISTORY), future: [] };
    }),

  select: (uid) => set({ selectedUid: uid }),

  undo: () =>
    set((s) => {
      const previous = s.past[s.past.length - 1];
      if (!previous) return {};
      const selectedUid = previous.components.some(
        (c) => c.uid === s.selectedUid
      )
        ? s.selectedUid
        : null;
      return {
        ...previous,
        past: s.past.slice(0, -1),
        future: [snap(s), ...s.future].slice(0, MAX_HISTORY),
        selectedUid,
      };
    }),

  redo: () =>
    set((s) => {
      const next = s.future[0];
      if (!next) return {};
      const selectedUid = next.components.some((c) => c.uid === s.selectedUid)
        ? s.selectedUid
        : null;
      return {
        ...next,
        past: [...s.past, snap(s)].slice(-MAX_HISTORY),
        future: s.future.slice(1),
        selectedUid,
      };
    }),

  clearAll: () =>
    set((s) => withHistory(s, { components: [], selectedUid: null })),

  requestCameraReset: () =>
    set((s) => ({ cameraResetNonce: s.cameraResetNonce + 1 })),
}));
