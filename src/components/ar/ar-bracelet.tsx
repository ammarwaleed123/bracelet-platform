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

// Stable-roll reference: the ring's local +Z is pointed along this (projected
// onto the ring plane) so the beaded arc faces the camera and never spins as
// the forearm axis moves. REF_ALT avoids the degeneracy when axis ∥ REF.
const REF = new THREE.Vector3(0, 0, 1);
const REF_ALT = new THREE.Vector3(0, 1, 0);

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * The bracelet, reusing the studio meshes, anchored to the smoothed wrist pose.
 * The ring geometry lies in the XZ plane (local axis = +Y); we rotate that axis
 * onto the measured 3D forearm axis so the ring plane stays perpendicular to the
 * forearm (a band when the arm is across the frame, a circle when it points at
 * the camera), slerp-smoothed, and fade opacity with detection presence.
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
  const ringX = useRef(new THREE.Vector3());
  const ringZ = useRef(new THREE.Vector3());
  const basis = useRef(new THREE.Matrix4());
  const quatTarget = useRef(new THREE.Quaternion());

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

    // Snap the smoother + orientation on re-acquisition (no easing from stale state).
    const justAppeared = visible && !wasVisible.current;
    if (justAppeared) smoother.current.reset();
    wasVisible.current = visible;

    if (visible && raw) {
      const pose = smoother.current.smooth(raw, t, AR_TUNING);
      g.position.set(pose.x, pose.y, 0);

      const scale = layout.radiusUnits > 0 ? pose.radius / layout.radiusUnits : 0;
      g.scale.setScalar(scale);

      // Ring normal = the measured 3D forearm axis — the ring plane stays 90° to
      // the forearm (no fake camera tilt). Build a target orientation with STABLE
      // roll (local +Y → axis; local +Z → a fixed reference projected onto the
      // ring plane) so the beaded arc never spins as the axis moves.
      const axis = forearmAxis.current.set(pose.ax, pose.ay, pose.az).normalize();
      const ref = Math.abs(axis.dot(REF)) > 0.9 ? REF_ALT : REF;
      ringX.current.crossVectors(ref, axis).normalize();
      ringZ.current.crossVectors(axis, ringX.current).normalize();
      basis.current.makeBasis(ringX.current, axis, ringZ.current);
      quatTarget.current.setFromRotationMatrix(basis.current);

      // Slerp toward the target for calm, flicker-free motion (frame-rate
      // corrected); snap instantly on the first frame after re-acquisition.
      if (justAppeared || !animate) {
        g.quaternion.copy(quatTarget.current);
      } else {
        const s = 1 - Math.pow(1 - AR_TUNING.orientSlerp, delta * 60);
        g.quaternion.slerp(quatTarget.current, s);
      }

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
