"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useStudioStore } from "@/lib/studio/store";
import {
  computeLayout,
  indexCatalog,
  nearestSlotIndex,
  resolveComponents,
} from "@/lib/studio/derive";
import type { StudioCatalog } from "@/lib/studio/types";
import { BaseRing, ComponentMesh, SoftShadow } from "./meshes";

// The bracelet lies flat in the XZ plane (y = 0).
const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Bracelet({
  catalog,
  controlsRef,
  renderFit,
}: {
  catalog: StudioCatalog;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  /** Renders the camera-fit helper once the ring radius is known. */
  renderFit?: (radius: number) => ReactNode;
}) {
  const index = useMemo(() => indexCatalog(catalog), [catalog]);
  const { camera, gl, raycaster } = useThree();

  const baseId = useStudioStore((s) => s.baseId);
  const sizeCm = useStudioStore((s) => s.sizeCm);
  const components = useStudioStore((s) => s.components);
  const selectedUid = useStudioStore((s) => s.selectedUid);

  const animate = useMemo(() => !prefersReducedMotion(), []);
  const resolved = useMemo(
    () => resolveComponents(index, components),
    [index, components]
  );
  const base = baseId ? index.bases.get(baseId) : undefined;

  const layout = useMemo(
    () => computeLayout(resolved.map((c) => c.diameterMm), sizeCm),
    [resolved, sizeCm]
  );

  // Drag state in refs so the render-loop and window listeners share it.
  const dragUidRef = useRef<string | null>(null);
  const dragAngleRef = useRef<number | null>(null);
  const dragBefore = useRef(useStudioStore.getState().getDesignState());
  // Whether the pointer is currently over the delete bin (decides drop action).
  const overTrashRef = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;

    const pointerToGround = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const hit = new THREE.Vector3();
      return raycaster.ray.intersectPlane(GROUND_PLANE, hit) ? hit : null;
    };

    const onMove = (e: PointerEvent) => {
      if (!dragUidRef.current) return;

      // Is the pointer over the delete bin? (HTML overlay, hit-tested by rect.)
      const bin = document
        .getElementById("studio-trash")
        ?.getBoundingClientRect();
      const overTrash =
        !!bin &&
        e.clientX >= bin.left &&
        e.clientX <= bin.right &&
        e.clientY >= bin.top &&
        e.clientY <= bin.bottom;
      overTrashRef.current = overTrash;
      useStudioStore.getState().setDragOverTrash(overTrash);
      // While hovering the bin, stop reordering so the bead sits still there.
      if (overTrash) return;

      const hit = pointerToGround(e.clientX, e.clientY);
      if (!hit) return;

      const diameters = useStudioStore.getState().components.map((c) => {
        const r =
          c.kind === "bead"
            ? index.beads.get(c.refId)
            : index.charms.get(c.refId);
        return r?.diameterMm ?? 8;
      });
      if (diameters.length === 0) return;

      const { items } = computeLayout(diameters, useStudioStore.getState().sizeCm);
      const angle = Math.atan2(hit.z, hit.x);

      // The dragged bead glides flat along the string to the cursor's angle.
      dragAngleRef.current = angle;

      useStudioStore
        .getState()
        .moveLive(dragUidRef.current, nearestSlotIndex(items, angle));
    };

    const onUp = () => {
      const uid = dragUidRef.current;
      if (!uid) return;
      dragUidRef.current = null;
      dragAngleRef.current = null;
      if (overTrashRef.current) {
        // Dropped on the bin — delete it as one clean undo step.
        useStudioStore.getState().removeOnDrop(dragBefore.current, uid);
      } else {
        useStudioStore.getState().commitInteraction(dragBefore.current);
      }
      overTrashRef.current = false;
      useStudioStore.getState().endDrag();
      if (controlsRef.current) controlsRef.current.enabled = true;
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [camera, gl, raycaster, controlsRef, index]);

  const onDragStart = (uid: string) => {
    dragUidRef.current = uid;
    dragAngleRef.current = null;
    overTrashRef.current = false;
    dragBefore.current = useStudioStore.getState().getDesignState();
    useStudioStore.getState().select(uid);
    useStudioStore.getState().beginDrag(uid);
    if (controlsRef.current) controlsRef.current.enabled = false;
    document.body.style.cursor = "grabbing";
  };

  return (
    <group>
      {renderFit?.(layout.radiusUnits)}
      <SoftShadow radius={layout.radiusUnits} />
      <BaseRing base={base} radius={layout.radiusUnits} />
      {resolved.map((c, i) => (
        <ComponentMesh
          key={c.uid}
          resolved={c}
          targetAngle={layout.items[i]?.angle ?? 0}
          radius={layout.radiusUnits}
          selected={c.uid === selectedUid}
          animate={animate}
          dragUidRef={dragUidRef}
          dragAngleRef={dragAngleRef}
          onSelect={(uid) => useStudioStore.getState().select(uid)}
          onDragStart={onDragStart}
        />
      ))}
    </group>
  );
}
