"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useStudioStore } from "@/lib/studio/store";
import {
  indexCatalog,
  resolveComponents,
  ringRadiusUnits,
  slotPosition,
} from "@/lib/studio/derive";
import type { StudioCatalog } from "@/lib/studio/types";
import { BaseRing, ComponentMesh } from "./meshes";

const RING_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

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
  const radius = ringRadiusUnits(sizeCm);

  // Drag-to-reorder state kept in refs so window listeners see fresh values.
  const dragUid = useRef<string | null>(null);
  const dragBefore = useRef(useStudioStore.getState().getDesignState());

  useEffect(() => {
    const canvas = gl.domElement;

    const slotFromPointer = (clientX: number, clientY: number): number | null => {
      const rect = canvas.getBoundingClientRect();
      const ndc = {
        x: ((clientX - rect.left) / rect.width) * 2 - 1,
        y: -((clientY - rect.top) / rect.height) * 2 + 1,
      };
      raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), camera);
      const hit = new THREE.Vector3();
      if (!raycaster.ray.intersectPlane(RING_PLANE, hit)) return null;
      const count = useStudioStore.getState().components.length;
      if (count === 0) return null;
      const angle = Math.atan2(hit.y, hit.x);
      const raw = ((Math.PI / 2 - angle) / (Math.PI * 2)) * count;
      return ((Math.round(raw) % count) + count) % count;
    };

    const onMove = (e: PointerEvent) => {
      if (!dragUid.current) return;
      const target = slotFromPointer(e.clientX, e.clientY);
      if (target !== null) useStudioStore.getState().moveLive(dragUid.current, target);
    };

    const onUp = () => {
      if (!dragUid.current) return;
      dragUid.current = null;
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
  }, [camera, gl, raycaster, controlsRef]);

  const onDragStart = (uid: string) => {
    dragUid.current = uid;
    dragBefore.current = useStudioStore.getState().getDesignState();
    useStudioStore.getState().select(uid);
    if (controlsRef.current) controlsRef.current.enabled = false;
    document.body.style.cursor = "grabbing";
  };

  return (
    <group>
      <BaseRing base={base} radius={radius} />
      {resolved.map((c, i) => (
        <ComponentMesh
          key={c.uid}
          resolved={c}
          position={slotPosition(sizeCm, i, resolved.length)}
          selected={c.uid === selectedUid}
          animate={animate}
          onSelect={(uid) => useStudioStore.getState().select(uid)}
          onDragStart={onDragStart}
        />
      ))}
    </group>
  );
}
