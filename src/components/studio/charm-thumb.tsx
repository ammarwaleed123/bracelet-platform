"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, Center, useGLTF } from "@react-three/drei";

/**
 * A tiny live 3D preview of a .glb charm for the picker — model charms have no
 * flat image, so we render the model itself as the thumbnail. Pointer events are
 * disabled so taps fall through to the tile's "add" button.
 */
function ThumbModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const object = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={object} />;
}

export function CharmModelThumb({ url }: { url: string }) {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0.7, 0.35, 1.9], fov: 32 }}
      gl={{ alpha: true, antialias: true }}
      style={{ width: "100%", height: "100%", pointerEvents: "none" }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <directionalLight position={[-4, 1, -2]} intensity={0.6} color="#fff2df" />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.15}>
          <Center>
            <ThumbModel url={url} />
          </Center>
        </Bounds>
      </Suspense>
    </Canvas>
  );
}
