"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
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
}: {
  catalog: StudioCatalog;
  controlsRef: RefObject<OrbitControlsImpl | null>;
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
  const dragPointRef = useRef<THREE.Vector3 | null>(null);
  const dragBefore = useRef(useStudioStore.getState().getDesignState());

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
      const hit = pointerToGround(e.clientX, e.clientY);
      if (!hit) return;

      // The dragged bead visually follows the finger (lifted slightly).
      dragPointRef.current = new THREE.Vector3(hit.x, 0.3, hit.z);

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
      useStudioStore
        .getState()
        .moveLive(dragUidRef.current, nearestSlotIndex(items, angle));
    };

    const onUp = () => {
      if (!dragUidRef.current) return;
      dragUidRef.current = null;
      dragPointRef.current = null;
      useStudioStore.getState().commitInteraction(dragBefore.current);
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
    dragPointRef.current = null;
    dragBefore.current = useStudioStore.getState().getDesignState();
    useStudioStore.getState().select(uid);
    if (controlsRef.current) controlsRef.current.enabled = false;
    document.body.style.cursor = "grabbing";
  };

  return (
    <group>
      <SoftShadow radius={layout.radiusUnits} />
      <BaseRing base={base} radius={layout.radiusUnits} />
      {resolved.map((c, i) => (
        <ComponentMesh
          key={c.uid}
          resolved={c}
          position={layout.items[i]?.position ?? [0, 0, 0]}
          selected={c.uid === selectedUid}
          animate={animate}
          dragUidRef={dragUidRef}
          dragPointRef={dragPointRef}
          onSelect={(uid) => useStudioStore.getState().select(uid)}
          onDragStart={onDragStart}
        />
      ))}
    </group>
  );
}
