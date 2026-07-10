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
  shakeRef,
  reduced,
}: {
  beads: HeroBead[];
  progressRef: React.MutableRefObject<number>;
  shakeRef: React.MutableRefObject<number>;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<THREE.Mesh[]>([]);
  const ringRef = useRef<THREE.Mesh>(null);

  const count = beads.length >= 12 ? Math.min(beads.length, 18) : 14;
  const cycled = useMemo(
    () => Array.from({ length: count }, (_, i) => beads[i % beads.length]!),
    [beads, count]
  );

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

  const scatter = useMemo(
    () =>
      cycled.map(
        () =>
          new THREE.Vector3(
            (Math.random() * 2 - 1) * 5,
            4 + Math.random() * 6,
            (Math.random() * 2 - 1) * 5
          )
      ),
    [cycled]
  );

  useFrame((state, dtRaw) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    const t = state.clock.elapsedTime;
    const p = reduced ? 1 : clamp01(progressRef.current ?? 0);
    const assembleP = clamp01(p / 0.35);

    // Cinematic camera: a gentle push-in + orbit, looking at a fixed height.
    // Pull back on portrait screens so the wide ring fits instead of cropping.
    const aspect = state.size.width / Math.max(1, state.size.height);
    const fit = aspect < 1 ? Math.min(2.3, 1 / aspect) : 1;
    const camZ = (9 - p * 2.0) * fit;
    const camY = (4.0 - p * 0.4) * fit;
    const camX = Math.sin(p * Math.PI * 0.5) * 0.6 * fit;
    state.camera.position.x += (camX - state.camera.position.x) * 0.08;
    state.camera.position.y += (camY - state.camera.position.y) * 0.08;
    state.camera.position.z += (camZ - state.camera.position.z) * 0.08;
    state.camera.lookAt(0, 1.5, 0);

    // Rise as you scroll so the ring climbs above the text band (no overlap).
    g.position.y = 1.2 + p * 1.9;
    // The ring turns (a gentle idle spin + a scroll-scrub) and tilts face-on.
    g.rotation.y = (reduced ? 0 : t * 0.12) + p * Math.PI * 1.1;
    g.rotation.x = -0.55 + smoothstep(0.3, 1, p) * 0.42;

    // Shake-to-shake: a decaying impulse jitters every bead when the phone is
    // shaken (set from the device's accelerometer in the wrapper).
    const shake = reduced ? 0 : shakeRef.current ?? 0;
    if (shakeRef.current > 0.001) shakeRef.current *= 0.9;

    for (let i = 0; i < meshes.current.length; i++) {
      const m = meshes.current[i];
      const target = ring[i];
      const from = scatter[i];
      if (!m || !target || !from) continue;
      const local = clamp01((assembleP - (i / count) * 0.35) / 0.65);
      const e = easeOutCubic(local);
      m.position.lerpVectors(from, target, e);
      if (!reduced && e < 0.999) {
        m.position.y += Math.sin(t * 1.6 + i) * 0.06 * (1 - e);
        m.rotation.y += dt * 0.6 * (1 - e);
      }
      if (shake > 0.01) {
        m.position.x += Math.sin(t * 45 + i * 12.9) * shake * 0.18;
        m.position.y += Math.cos(t * 40 + i * 7.3) * shake * 0.18;
        m.position.z += Math.sin(t * 52 + i * 3.1) * shake * 0.14;
      }
    }

    if (ringRef.current) {
      const rm = ringRef.current.material as THREE.MeshStandardMaterial;
      rm.opacity = smoothstep(0.1, 0.5, assembleP);
    }
  });

  return (
    <group ref={group} position={[0, 1.3, 0]}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.035, 12, 120]} />
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
            <sphereGeometry args={[r, 24, 24]} />
            {/* Cheap glossy material (no transmission pass) — much lighter. */}
            <meshStandardMaterial
              color={b.colorHex}
              roughness={Math.min(0.5, b.roughness)}
              metalness={b.metalness}
              envMapIntensity={1.1}
            />
          </mesh>
        );
      })}
    </group>
  );
}

export default function CinematicBraceletCanvas({
  beads,
  progressRef,
  shakeRef,
  reduced,
  active = true,
}: {
  beads: HeroBead[];
  progressRef: React.MutableRefObject<number>;
  shakeRef: React.MutableRefObject<number>;
  reduced: boolean;
  /** When false (intro scrolled out of view), stop rendering to save the GPU. */
  active?: boolean;
}) {
  return (
    <Canvas
      // Cap the pixel ratio for performance; pause the render loop off-screen.
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 4.2, 9], fov: 40, near: 0.1, far: 100 }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} />
      <directionalLight position={[-5, 3, -2]} intensity={0.4} color="#fff2df" />
      <Environment resolution={64} frames={1}>
        <Lightformer intensity={2.2} position={[0, 5, 3]} scale={[10, 10, 1]} />
        <Lightformer
          intensity={1.1}
          position={[-5, 2, 2]}
          scale={[5, 5, 1]}
          color="#fff5e6"
        />
      </Environment>
      <Scene
        beads={beads}
        progressRef={progressRef}
        shakeRef={shakeRef}
        reduced={reduced}
      />
    </Canvas>
  );
}
