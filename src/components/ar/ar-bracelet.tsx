"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Reuse the studio's render primitives + layout math (import only — never edit).
import { BaseRing, ComponentMesh } from "@/components/studio/scene/meshes";
import {
  computeLayout,
  indexCatalog,
  resolveComponents,
} from "@/lib/studio/derive";
import type { StudioCatalog, StudioDesignState } from "@/lib/studio/types";
import { AR_TUNING, PoseSmoother, type ArPose } from "@/lib/ar/pose";

/** Shared, mutable target the detection loop writes and the renderer reads. */
export type PoseTarget = { raw: ArPose | null };

const UP = new THREE.Vector3(0, 1, 0);

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The bracelet, reusing the studio meshes, anchored to the smoothed wrist pose.
 * The ring geometry lies in the XZ plane (local axis = +Y); we rotate that axis
 * onto the forearm direction (pitched out of screen by `ringTiltOffsetDeg`) so
 * it reads as a band around the wrist, and fade opacity with detection presence.
 */
export function ArBracelet({
  catalog,
  design,
  poseRef,
}: {
  catalog: StudioCatalog;
  design: StudioDesignState;
  poseRef: RefObject<PoseTarget>;
}) {
  const index = useMemo(() => indexCatalog(catalog), [catalog]);
  const animate = useMemo(() => !prefersReducedMotion(), []);
  const resolved = useMemo(
    () => resolveComponents(index, design.components),
    [index, design.components]
  );
  const base = design.baseId ? index.bases.get(design.baseId) : undefined;
  const layout = useMemo(
    () => computeLayout(resolved.map((c) => c.diameterMm), design.sizeCm),
    [resolved, design.sizeCm]
  );

  const groupRef = useRef<THREE.Group>(null);
  const occluderRef = useRef<THREE.Mesh>(null);
  const smoother = useRef(new PoseSmoother());
  const wasVisible = useRef(false);
  const opacity = useRef(0);
  const forearmAxis = useRef(new THREE.Vector3());
  const quat = useRef(new THREE.Quaternion());

  // Inert drag refs so the reused ComponentMesh runs with no studio behavior.
  const dragUidRef = useRef<string | null>(null);
  const dragPointRef = useRef<THREE.Vector3 | null>(null);
  const noop = () => {};

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const raw = poseRef.current.raw;
    const visible = raw?.visible ?? false;
    const t = performance.now() / 1000;

    // Snap the smoother on re-acquisition so it doesn't ease from stale state.
    if (visible && !wasVisible.current) smoother.current.reset();
    wasVisible.current = visible;

    if (visible && raw) {
      const pose = smoother.current.smooth(raw, t, AR_TUNING);
      g.position.set(pose.x, pose.y, 0);

      const scale = layout.radiusUnits > 0 ? pose.radius / layout.radiusUnits : 0;
      g.scale.setScalar(scale);

      // Ring axis → forearm direction, pitched toward the camera to open the
      // ellipse so the band reads as 3D rather than edge-on.
      const tilt = (AR_TUNING.ringTiltOffsetDeg * Math.PI) / 180;
      const ct = Math.cos(tilt);
      forearmAxis.current
        .set(Math.cos(pose.angle) * ct, Math.sin(pose.angle) * ct, Math.sin(tilt))
        .normalize();
      quat.current.setFromUnitVectors(UP, forearmAxis.current);
      g.quaternion.copy(quat.current);

      // Size the invisible wrist occluder (hides the bracelet's back half).
      if (occluderRef.current) {
        const f = AR_TUNING.occluderRadiusFactor;
        occluderRef.current.scale.set(f, 1, f);
      }
    }

    // Fade in/out with detection presence (never freeze visibly mid-air).
    const target = visible ? 1 : 0;
    const k = animate ? Math.min(1, delta * 8) : 1;
    opacity.current += (target - opacity.current) * k;
    g.visible = opacity.current > 0.01;
    const fading = opacity.current < 0.99;
    g.traverse((o) => {
      // The occluder is a depth-only mask — never fade or recolor it.
      if (o.name === "ar-occluder") return;
      const mat = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (mat && "opacity" in mat) {
        mat.transparent = fading;
        mat.depthWrite = !fading;
        (mat as THREE.Material & { opacity: number }).opacity = opacity.current;
      }
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Invisible forearm occluder: writes depth but no color, so the back
          half of the bracelet is hidden behind the wrist (fakes occlusion). */}
      <mesh ref={occluderRef} name="ar-occluder" renderOrder={-1}>
        <cylinderGeometry
          args={[layout.radiusUnits, layout.radiusUnits, layout.radiusUnits * 8, 28, 1, true]}
        />
        <meshBasicMaterial colorWrite={false} />
      </mesh>
      <BaseRing base={base} radius={layout.radiusUnits} />
      {resolved.map((c, i) => (
        <ComponentMesh
          key={c.uid}
          resolved={c}
          targetAngle={layout.items[i]?.angle ?? 0}
          radius={layout.radiusUnits}
          selected={false}
          animate={animate}
          dragUidRef={dragUidRef}
          dragPointRef={dragPointRef}
          onSelect={noop}
          onDragStart={noop}
        />
      ))}
    </group>
  );
}
