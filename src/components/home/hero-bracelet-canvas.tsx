"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

import type { HeroBead } from "@/lib/catalog/hero-beads";

function Scene({
  beads,
  progressRef,
  reduced,
}: {
  beads: HeroBead[];
  progressRef: React.MutableRefObject<number>;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<THREE.Mesh[]>([]);

  const count = beads.length >= 12 ? Math.min(beads.length, 18) : 14;
  const cycled = useMemo(
    () => Array.from({ length: count }, (_, i) => beads[i % beads.length]!),
    [beads, count]
  );

  // Beads sit adjacent around the ring, like the studio layout.
  const { ring, radius } = useMemo(() => {
    const diams = cycled.map((b) => b.diameterMm / 10);
    const circ = diams.reduce((a, b) => a + b, 0);
    const R = circ / (2 * Math.PI);
    let cursor = 0;
    const ring = diams.map((d) => {
      const center = cursor + d / 2;
      cursor += d;
      const a = Math.PI / 2 - (center / circ) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R);
    });
    return { ring, radius: R };
  }, [cycled]);

  useFrame((state, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    const t = state.clock.elapsedTime;
    const scroll = reduced ? 0 : progressRef.current ?? 0;

    // A gentle, continuous turn in the light, with a hint of scroll-driven tilt.
    if (!reduced) g.rotation.y += dt * 0.3;
    g.rotation.x = -0.5 + scroll * 0.18;

    for (let i = 0; i < meshes.current.length; i++) {
      const m = meshes.current[i];
      const target = ring[i];
      if (!m || !target) continue;
      m.position.copy(target);
      if (!reduced) m.position.y += Math.sin(t * 1.2 + i) * 0.04;
    }
  });

  return (
    <group ref={group} rotation={[-0.5, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.035, 16, 180]} />
        <meshStandardMaterial
          color="#c8a24a"
          metalness={0.9}
          roughness={0.25}
          envMapIntensity={1.2}
        />
      </mesh>

      {cycled.map((b, i) => {
        const r = Math.max(0.28, b.diameterMm / 20);
        return (
          <mesh
            key={i}
            position={ring[i]}
            ref={(el) => {
              if (el) meshes.current[i] = el;
            }}
          >
            <sphereGeometry args={[r, 32, 32]} />
            <meshPhysicalMaterial
              color={b.colorHex}
              roughness={b.roughness}
              metalness={b.metalness}
              transmission={b.transmission}
              thickness={r * 2}
              ior={1.5}
              clearcoat={0.25}
              envMapIntensity={1.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function HeroBraceletCanvas({
  beads,
  progressRef,
  reduced,
}: {
  beads: HeroBead[];
  progressRef: React.MutableRefObject<number>;
  reduced: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 2.3, 6.6], fov: 42, near: 0.1, far: 100 }}
      gl={{ alpha: true, antialias: true }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={1.1} />
      <directionalLight position={[-5, 3, -2]} intensity={0.4} color="#fff2df" />
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2} position={[0, 4, 3]} scale={[8, 8, 1]} />
        <Lightformer
          intensity={1}
          position={[-4, 2, 2]}
          scale={[4, 4, 1]}
          color="#fff5e6"
        />
      </Environment>
      <Scene beads={beads} progressRef={progressRef} reduced={reduced} />
    </Canvas>
  );
}
