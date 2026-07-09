"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { ResolvedComponent } from "@/lib/studio/derive";
import { componentRadiusUnits } from "@/lib/studio/derive";
import type { StudioBase } from "@/lib/studio/types";

const GOLD = "#b08d57";

/* ------------------------------------------------------------ base ring -- */
/* A thin strung cord/chain lying flat (rotated into the XZ plane). */

export function BaseRing({
  base,
  radius,
}: {
  base: StudioBase | undefined;
  radius: number;
}) {
  const isBangle = base?.type === "bangle";
  const isCord = base?.type === "cord";
  const tube = isBangle ? 0.22 : 0.035;
  const color = base?.model3dParams?.color ?? base?.colorHex ?? GOLD;
  const metalness = isCord ? 0.1 : isBangle ? 0.95 : 0.85;
  const roughness = isCord ? 0.7 : 0.3;

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
      <torusGeometry args={[radius, tube, 20, 200]} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        envMapIntensity={1.1}
      />
    </mesh>
  );
}

/* ---------------------------------------------------- charm geometries --- */

function heartShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.3);
  s.bezierCurveTo(0, 0.45, -0.25, 0.6, -0.45, 0.35);
  s.bezierCurveTo(-0.7, 0.05, -0.35, -0.25, 0, -0.55);
  s.bezierCurveTo(0.35, -0.25, 0.7, 0.05, 0.45, 0.35);
  s.bezierCurveTo(0.25, 0.6, 0, 0.45, 0, 0.3);
  return s;
}

function starShape(points = 5, outer = 0.5, inner = 0.22): THREE.Shape {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

function moonShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0.22, 0, 0.42, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return s;
}

const EXTRUDE = {
  depth: 0.16,
  bevelEnabled: true,
  bevelSize: 0.03,
  bevelThickness: 0.03,
  bevelSegments: 2,
};

function useCharmGeometry(shape: ResolvedComponent["charmShape"]) {
  return useMemo(() => {
    switch (shape) {
      case "heart":
        return new THREE.ExtrudeGeometry(heartShape(), EXTRUDE).center();
      case "star":
        return new THREE.ExtrudeGeometry(starShape(), EXTRUDE).center();
      case "moon":
        return new THREE.ExtrudeGeometry(moonShape(), EXTRUDE).center();
      default:
        return new THREE.CylinderGeometry(0.42, 0.42, 0.16, 40).rotateX(
          Math.PI / 2
        );
    }
  }, [shape]);
}

/* ------------------------------------------------------- bead material --- */

function beadMaterialProps(resolved: ResolvedComponent) {
  const mat = resolved.material;
  const color = mat?.color ?? resolved.colorHex;
  const isCharm = resolved.kind === "charm";

  if (isCharm) {
    return {
      color,
      metalness: mat?.metalness ?? 1,
      roughness: mat?.roughness ?? 0.32,
      transmission: 0,
    };
  }

  const transmissionByFinish =
    resolved.finish === "faceted"
      ? 0.6
      : resolved.finish === "polished"
        ? 0.32
        : 0; // matte / metallic stay opaque

  return {
    color,
    metalness: mat?.metalness ?? 0,
    roughness: mat?.roughness ?? 0.2,
    transmission: mat?.transmission ?? transmissionByFinish,
  };
}

/* --------------------------------------------------- component (mesh) ---- */

export function ComponentMesh({
  resolved,
  position,
  selected,
  animate,
  onSelect,
  onDragStart,
}: {
  resolved: ResolvedComponent;
  position: [number, number, number];
  selected: boolean;
  animate: boolean;
  onSelect: (uid: string) => void;
  onDragStart: (uid: string) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    if (animate) {
      g.position.lerp(target, Math.min(1, delta * 12));
      const scale = selected ? 1.1 : 1;
      g.scale.setScalar(
        THREE.MathUtils.lerp(g.scale.x, scale, Math.min(1, delta * 14))
      );
    } else {
      g.position.copy(target);
      g.scale.setScalar(selected ? 1.1 : 1);
    }
  });

  const radius = componentRadiusUnits(resolved.diameterMm);
  const isCharm = resolved.kind === "charm";
  const mat = beadMaterialProps(resolved);
  const charmGeometry = useCharmGeometry(resolved.charmShape);

  return (
    <group
      ref={group}
      position={position}
      onPointerDown={(e) => {
        e.stopPropagation();
        onDragStart(resolved.uid);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(resolved.uid);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "grab";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      {isCharm ? (
        <mesh geometry={charmGeometry} scale={radius / 0.5} castShadow>
          <meshStandardMaterial
            color={mat.color}
            metalness={mat.metalness}
            roughness={mat.roughness}
            envMapIntensity={1.2}
          />
        </mesh>
      ) : (
        <mesh castShadow>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshPhysicalMaterial
            color={mat.color}
            metalness={mat.metalness}
            roughness={mat.roughness}
            transmission={mat.transmission}
            thickness={radius * 3}
            ior={1.5}
            clearcoat={0.3}
            clearcoatRoughness={0.4}
            attenuationColor={mat.color}
            attenuationDistance={1.2}
            envMapIntensity={1.2}
            specularIntensity={1}
          />
        </mesh>
      )}

      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.3, 0.02, 12, 64]} />
          <meshStandardMaterial
            color={GOLD}
            metalness={0.6}
            roughness={0.3}
            emissive={GOLD}
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
}
