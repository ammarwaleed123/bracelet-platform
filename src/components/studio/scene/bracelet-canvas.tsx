"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useStudioStore } from "@/lib/studio/store";
import type { StudioCatalog } from "@/lib/studio/types";
import { Bracelet } from "./bracelet";

const FRONT = new THREE.Vector3(0, 6.5, 6);
const ORIGIN = new THREE.Vector3(0, 0, 0);

/** Smoothly returns the camera to the default flat-lay view when requested. */
function CameraReset({
  controlsRef,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const nonce = useStudioStore((s) => s.cameraResetNonce);
  const { camera } = useThree();
  const active = useRef(false);

  useEffect(() => {
    if (nonce > 0) active.current = true;
  }, [nonce]);

  useFrame((_, delta) => {
    if (!active.current) return;
    const t = Math.min(1, delta * 6);
    camera.position.lerp(FRONT, t);
    const controls = controlsRef.current;
    if (controls) {
      controls.target.lerp(ORIGIN, t);
      controls.update();
    }
    if (camera.position.distanceTo(FRONT) < 0.02) {
      camera.position.copy(FRONT);
      active.current = false;
    }
  });

  return null;
}

export function BraceletCanvas({ catalog }: { catalog: StudioCatalog }) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const select = useStudioStore((s) => s.select);

  return (
    <Canvas
      dpr={[1, 2]} // cap pixel ratio at 2 for performance (spec §4)
      camera={{ position: [0, 6.5, 6], fov: 35, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={["#f7f4ef"]} />

      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-6, 3, -2]} intensity={0.4} color="#fff2df" />

      {/* Procedural environment for gemstone reflections + transmission
          backdrop — no external HDRI, baked once. */}
      <Environment resolution={256} frames={1}>
        <Lightformer intensity={2.4} position={[0, 5, 2]} scale={[10, 10, 1]} />
        <Lightformer
          intensity={1.1}
          position={[-5, 2, 2]}
          scale={[5, 5, 1]}
          color="#fff5e6"
        />
        <Lightformer
          intensity={0.9}
          position={[5, 1, -2]}
          scale={[4, 4, 1]}
          color="#ffffff"
        />
      </Environment>

      {/* Bracelet includes its own soft ground shadow, sized to the ring. */}
      <Bracelet catalog={catalog} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        minDistance={4}
        maxDistance={13}
        minPolarAngle={0.2}
        maxPolarAngle={1.4}
      />
      <CameraReset controlsRef={controlsRef} />
    </Canvas>
  );
}
