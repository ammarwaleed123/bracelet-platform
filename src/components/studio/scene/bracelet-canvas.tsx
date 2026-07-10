"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import { useStudioStore } from "@/lib/studio/store";
import { registerCapture } from "@/lib/studio/capture";
import type { StudioCatalog } from "@/lib/studio/types";
import { Bracelet } from "./bracelet";

// Direction the camera looks from (a gentle top-down front view). The actual
// distance is computed to fit the whole bracelet for the current viewport.
const VIEW_DIR = new THREE.Vector3(0, 6.5, 6).normalize();
const ORIGIN = new THREE.Vector3(0, 0, 0);

/**
 * Places the camera so the entire bracelet fits the frame, accounting for the
 * viewport's aspect ratio. On a portrait phone the horizontal field of view is
 * much narrower than the vertical, so we pull the camera back until the wide
 * ring fits horizontally too — otherwise the default view crops the bracelet.
 * Writes the computed position into `frontRef` so the reset button and the
 * initial mount share one target. Refits on viewport resize / orientation flip.
 */
function FitCamera({
  radius,
  frontRef,
  controlsRef,
}: {
  radius: number;
  frontRef: React.RefObject<THREE.Vector3>;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const { camera, size } = useThree();
  // Latest radius without making it a refit trigger (see below).
  const radiusRef = useRef(radius);
  radiusRef.current = radius;
  // Only refit when the width changes (mount + orientation flip). Mobile
  // browsers change the viewport *height* as the URL bar shows/hides on scroll;
  // refitting on that would reset the user's camera angle mid-scroll.
  const lastWidth = useRef(-1);

  useEffect(() => {
    if (size.width === lastWidth.current) return;
    lastWidth.current = size.width;

    const cam = camera as THREE.PerspectiveCamera;
    // Bounding radius of the ring plus beads, with a little breathing room.
    const fitRadius = radiusRef.current + 1;
    const vHalf = ((cam.fov * Math.PI) / 180) / 2;
    const aspect = size.width / Math.max(1, size.height);
    const hHalf = Math.atan(Math.tan(vHalf) * aspect);
    const halfFov = Math.min(vHalf, hHalf);
    const dist = fitRadius / Math.sin(halfFov);

    frontRef.current.copy(VIEW_DIR).multiplyScalar(dist);
    cam.position.copy(frontRef.current);
    cam.updateProjectionMatrix();
    const controls = controlsRef.current;
    if (controls) {
      controls.target.copy(ORIGIN);
      controls.update();
    }
  }, [camera, size.width, size.height, frontRef, controlsRef]);

  return null;
}

/** Smoothly returns the camera to the fitted flat-lay view when requested. */
function CameraReset({
  controlsRef,
  frontRef,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  frontRef: React.RefObject<THREE.Vector3>;
}) {
  const nonce = useStudioStore((s) => s.cameraResetNonce);
  const { camera } = useThree();
  const active = useRef(false);

  useEffect(() => {
    if (nonce > 0) active.current = true;
  }, [nonce]);

  useFrame((_, delta) => {
    if (!active.current) return;
    const front = frontRef.current;
    const t = Math.min(1, delta * 6);
    camera.position.lerp(front, t);
    const controls = controlsRef.current;
    if (controls) {
      controls.target.lerp(ORIGIN, t);
      controls.update();
    }
    if (camera.position.distanceTo(front) < 0.02) {
      camera.position.copy(front);
      active.current = false;
    }
  });

  return null;
}

/** Registers a thumbnail-capture function backed by this canvas's renderer.
 *  Returns a compact, center-cropped square JPEG (well under the server-action
 *  body limit) rather than the full-resolution PNG. */
function CaptureRegistrar() {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    registerCapture(() => {
      // Hide the ground shadow and any selection halo so the thumbnail is clean
      // (they stay in the live scene), then render a fresh frame.
      const hidden: THREE.Object3D[] = [];
      scene.traverse((o) => {
        if (
          (o.name === "soft-shadow" || o.name === "selection-halo") &&
          o.visible
        ) {
          o.visible = false;
          hidden.push(o);
        }
      });
      gl.render(scene, camera);
      for (const o of hidden) o.visible = true;

      const src = gl.domElement;
      const size = 640;
      const off = document.createElement("canvas");
      off.width = size;
      off.height = size;
      const ctx = off.getContext("2d");
      if (!ctx) return null;
      // Premium framing: the bracelet contained and centered on a cream square
      // with a small margin.
      ctx.fillStyle = "#faf8f5";
      ctx.fillRect(0, 0, size, size);
      const margin = 0.03;
      const box = size * (1 - margin * 2);
      const scale = Math.min(box / src.width, box / src.height);
      const dw = src.width * scale;
      const dh = src.height * scale;
      ctx.drawImage(src, (size - dw) / 2, (size - dh) / 2, dw, dh);
      return off.toDataURL("image/jpeg", 0.85);
    });
    return () => registerCapture(null);
  }, [gl, scene, camera]);
  return null;
}

export function BraceletCanvas({ catalog }: { catalog: StudioCatalog }) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  // Shared fitted "front" view target, written by FitCamera, read by CameraReset.
  const frontRef = useRef(new THREE.Vector3(0, 6.5, 6));
  const select = useStudioStore((s) => s.select);

  return (
    <Canvas
      dpr={[1, 2]} // cap pixel ratio at 2 for performance (spec §4)
      camera={{ position: [0, 6.5, 6], fov: 35, near: 0.1, far: 100 }}
      // preserveDrawingBuffer lets us read the canvas for design thumbnails.
      gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={["#faf8f5"]} />

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

      {/* Bracelet includes its own soft ground shadow, sized to the ring.
          It renders FitCamera, which frames the whole ring on mount/resize. */}
      <Bracelet
        catalog={catalog}
        controlsRef={controlsRef}
        renderFit={(radius) => (
          <FitCamera
            radius={radius}
            frontRef={frontRef}
            controlsRef={controlsRef}
          />
        )}
      />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        minDistance={4}
        // Roomy enough for the fitted portrait-phone distance (wide ring, narrow
        // horizontal FOV) without clamping the initial framing.
        maxDistance={32}
        minPolarAngle={0.2}
        maxPolarAngle={1.4}
      />
      <CameraReset controlsRef={controlsRef} frontRef={frontRef} />
      <CaptureRegistrar />
    </Canvas>
  );
}
