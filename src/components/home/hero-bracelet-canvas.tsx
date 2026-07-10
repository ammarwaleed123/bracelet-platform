"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

import type { HeroBead } from "@/lib/catalog/hero-beads";

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

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
  const ringRef = useRef<THREE.Mesh>(null);

  // Cycle the available beads up to a fuller, even count for a nicer ring.
  const count = beads.length >= 12 ? Math.min(beads.length, 18) : 14;
  const cycled = useMemo(
    () => Array.from({ length: count }, (_, i) => beads[i % beads.length]!),
    [beads, count]
  );

  // Ring positions (beads sit adjacent around the circle, like the studio).
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

  // Scattered start positions — up high and spread out, so they fall into place.
  const scatter = useMemo(
    () =>
      cycled.map(
        () =>
          new THREE.Vector3(
            (Math.random() * 2 - 1) * 4.5,
            3 + Math.random() * 5.5,
            (Math.random() * 2 - 1) * 4.5
          )
      ),
    [cycled]
  );

  useFrame((state, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    const p = reduced ? 1 : clamp01(progressRef.current ?? 0);
    const t = state.clock.elapsedTime;

    if (!reduced) g.rotation.y += dt * 0.25;
    g.rotation.x = -0.5; // tilt the ring toward the camera

    for (let i = 0; i < meshes.current.length; i++) {
      const m = meshes.current[i];
      const target = ring[i];
      const from = scatter[i];
      if (!m || !target || !from) continue;
      // Staggered assembly — beads arrive one after another as you scroll.
      const local = clamp01((p - (i / count) * 0.35) / 0.65);
      const e = easeOutCubic(local);
      m.position.lerpVectors(from, target, e);
      if (!reduced && e < 0.999) {
        m.position.y += Math.sin(t * 1.6 + i) * 0.06 * (1 - e);
        m.rotation.y += dt * 0.6 * (1 - e);
      }
    }

    if (ringRef.current) {
      const rm = ringRef.current.material as THREE.MeshStandardMaterial;
      rm.opacity = smoothstep(0.25, 0.9, p);
      ringRef.current.scale.setScalar(0.6 + 0.4 * smoothstep(0.2, 1, p));
    }
  });

  return (
    <group ref={group}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.035, 16, 180]} />
        <meshStandardMaterial
          color="#c8a24a"
          metalness={0.9}
          roughness={0.25}
          transparent
          opacity={0}
          envMapIntensity={1.2}
        />
      </mesh>

      {cycled.map((b, i) => {
        const r = Math.max(0.28, b.diameterMm / 20);
        return (
          <mesh
            key={i}
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
