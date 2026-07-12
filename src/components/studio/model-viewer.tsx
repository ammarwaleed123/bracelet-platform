"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Center,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";

/**
 * A standalone full-screen viewer for a real 3D charm model (.glb). Auto-frames
 * whatever model it's given, lights it like the studio, and lets you orbit it
 * freely — the "true 3D" comparison against the flat/extruded photo charms.
 */
function Model({ src }: { src: string }) {
  const { scene } = useGLTF(src);
  return <primitive object={scene} />;
}

export function ModelViewer({ src }: { src: string }) {
  return (
    <div className="fixed inset-0 z-[60] bg-[#faf8f5]">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 4], fov: 40, near: 0.01, far: 100 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#faf8f5"]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} />

        {/* Same studio-style lighting rig so the gold reads believably. */}
        <Environment resolution={256} frames={1}>
          <Lightformer intensity={3} position={[0, 4, 5]} scale={[12, 8, 1]} color="#ffffff" />
          <Lightformer intensity={1.4} position={[-6, 2, 2]} scale={[6, 6, 1]} color="#fff3e2" />
          <Lightformer intensity={1.6} position={[6, 3, -3]} scale={[5, 7, 1]} color="#eef3ff" />
          <Lightformer intensity={2.2} position={[0, 7, 1]} scale={[9, 2.5, 1]} color="#ffffff" />
        </Environment>

        <Suspense
          fallback={
            <Html center>
              <span
                style={{
                  fontFamily: "Georgia, serif",
                  color: "#6f665d",
                  fontSize: "0.95rem",
                  whiteSpace: "nowrap",
                }}
              >
                Loading 3D charm…
              </span>
            </Html>
          }
        >
          {/* Auto-fit any model regardless of its native scale / origin. */}
          <Bounds fit clip observe margin={1.2}>
            <Center>
              <Model src={src} />
            </Center>
          </Bounds>
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          minDistance={1.2}
          maxDistance={14}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 top-[max(1.5rem,env(safe-area-inset-top))] flex flex-col items-center gap-1 px-4 text-center">
        <p className="font-serif text-lg text-ink">Real 3D model</p>
        <p className="text-sm text-ink-soft">Drag to rotate · pinch to zoom · see every side</p>
      </div>
    </div>
  );
}

useGLTF.preload("/charms/keyheart.glb");
