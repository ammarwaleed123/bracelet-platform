"use client";

import { useEffect, type RefObject } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

import type { StudioCatalog, StudioDesignState } from "@/lib/studio/types";
import { ArBracelet, type PoseTarget } from "./ar-bracelet";

/**
 * Keep the orthographic frustum at x ∈ [-aspect, aspect], y ∈ [-1, 1] so world
 * space matches the pose math (see pose.ts) and circles stay circular. Refit on
 * resize / orientation change.
 */
function OrthoRig() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    const aspect = size.width / Math.max(1, size.height);
    cam.left = -aspect;
    cam.right = aspect;
    cam.top = 1;
    cam.bottom = -1;
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

export function ArCanvas({
  catalog,
  design,
  poseRef,
}: {
  catalog: StudioCatalog;
  design: StudioDesignState;
  poseRef: RefObject<PoseTarget>;
}) {
  return (
    <Canvas
      orthographic
      dpr={[1, 2]}
      camera={{ position: [0, 0, 10], near: 0.1, far: 100, zoom: 1 }}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      className="pointer-events-none absolute inset-0"
    >
      <OrthoRig />

      {/* Lighting mirrors the studio so gold + gemstone materials read the same. */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <directionalLight position={[-6, 3, -2]} intensity={0.4} color="#fff2df" />
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

      <ArBracelet catalog={catalog} design={design} poseRef={poseRef} />
    </Canvas>
  );
}
