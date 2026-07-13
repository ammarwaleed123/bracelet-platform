"use client";

import { useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import {
  computeLayout,
  indexCatalog,
  resolveComponents,
} from "@/lib/studio/derive";
import type { StudioCatalog, StudioDesignState } from "@/lib/studio/types";
import { BaseRing, ComponentMesh } from "./meshes";

// Same gentle top-front direction the studio frames from.
const VIEW_DIR = new THREE.Vector3(0, 6.5, 6).normalize();
const FOV = 34;

/**
 * A read-only, props-driven bracelet render — reuses the studio's ring + meshes
 * to show a finished design (e.g. an AI concept) without the store, drag, or
 * selection. Non-interactive by default (pointer events off, for use inside a
 * clickable card); pass `interactive` for a slow turntable.
 */
export function BraceletPreview({
  catalog,
  design,
  interactive = false,
}: {
  catalog: StudioCatalog;
  design: StudioDesignState;
  interactive?: boolean;
}) {
  const index = useMemo(() => indexCatalog(catalog), [catalog]);
  const resolved = useMemo(
    () => resolveComponents(index, design.components),
    [index, design.components]
  );
  const base = design.baseId ? index.bases.get(design.baseId) : undefined;
  const layout = useMemo(
    () => computeLayout(resolved.map((c) => c.diameterMm), design.sizeCm),
    [resolved, design.sizeCm]
  );

  // Frame the whole ring (square-ish canvas → fit to the vertical FOV).
  const camPos = useMemo(() => {
    const fitRadius = layout.radiusUnits + 1.2;
    const dist = fitRadius / Math.sin(((FOV * Math.PI) / 180) / 2);
    return VIEW_DIR.clone().multiplyScalar(dist);
  }, [layout.radiusUnits]);

  const noUid = useRef<string | null>(null);
  const noPoint = useRef<THREE.Vector3 | null>(null);
  const noop = () => {};

  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [camPos.x, camPos.y, camPos.z], fov: FOV, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: interactive ? "auto" : "none" }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.1} />
      <directionalLight position={[-6, 3, -2]} intensity={0.4} color="#fff2df" />
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.4} position={[0, 5, 2]} scale={[10, 10, 1]} />
        <Lightformer intensity={1.1} position={[-5, 2, 2]} scale={[5, 5, 1]} color="#fff5e6" />
        <Lightformer intensity={0.9} position={[5, 1, -2]} scale={[4, 4, 1]} />
      </Environment>

      <group>
        <BaseRing base={base} radius={layout.radiusUnits} />
        {resolved.map((c, i) => (
          <ComponentMesh
            key={c.uid}
            resolved={c}
            targetAngle={layout.items[i]?.angle ?? 0}
            radius={layout.radiusUnits}
            selected={false}
            animate={false}
            dragUidRef={noUid}
            dragPointRef={noPoint}
            onSelect={noop}
            onDragStart={noop}
          />
        ))}
      </group>

      {interactive && (
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={false}
          autoRotate
          autoRotateSpeed={1.4}
          minPolarAngle={0.35}
          maxPolarAngle={1.45}
        />
      )}
    </Canvas>
  );
}
