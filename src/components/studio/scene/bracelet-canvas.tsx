"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useStudioStore } from "@/lib/studio/store";
import type { StudioCatalog } from "@/lib/studio/types";
import { Bracelet } from "./bracelet";

const FRONT = new THREE.Vector3(0, 0, 8);

/** Smoothly returns the camera to the front view when requested. */
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
      controls.target.lerp(new THREE.Vector3(0, 0, 0), t);
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
      camera={{ position: [0, 0, 8], fov: 40, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: false }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={["#f6f2eb"]} />

      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 6]} intensity={1.1} />
      <directionalLight position={[-5, -2, 3]} intensity={0.35} color="#fff2df" />

      {/* Procedural environment for metallic reflections — no external HDRI,
          baked once (frames=1) to keep the frame budget for interaction. */}
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={2.2} position={[0, 3, 4]} scale={[8, 8, 1]} />
        <Lightformer
          intensity={1}
          position={[-4, 1, 2]}
          scale={[4, 4, 1]}
          color="#fff5e6"
        />
        <Lightformer
          intensity={0.8}
          position={[4, -1, 2]}
          scale={[3, 3, 1]}
          color="#ffffff"
        />
      </Environment>

      <Bracelet catalog={catalog} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        minDistance={4}
        maxDistance={14}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI - Math.PI / 6}
      />
      <CameraReset controlsRef={controlsRef} />
    </Canvas>
  );
}
