"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { ResolvedComponent } from "@/lib/studio/derive";
import { componentRadiusUnits } from "@/lib/studio/derive";
import type { StudioBase } from "@/lib/studio/types";

const GOLD = "#b08d57";

/* ------------------------------------------------------------ base ring -- */

export function BaseRing({
  base,
  radius,
}: {
  base: StudioBase | undefined;
  radius: number;
}) {
  const params = base?.model3dParams;
  const tube = params?.thickness ?? 0.14;
  const color = params?.color ?? base?.colorHex ?? GOLD;
  const metalness = params?.metalness ?? (base?.type === "cord" ? 0 : 0.9);
  const roughness = params?.roughness ?? (base?.type === "cord" ? 0.8 : 0.25);

  return (
    <mesh rotation={[0, 0, 0]}>
      <torusGeometry args={[radius, tube, 24, 160]} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        envMapIntensity={1}
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
  // Crescent: an outer disc with an offset disc carved out as a hole.
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0.22, 0, 0.42, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return s;
}

const EXTRUDE = { depth: 0.16, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2 };

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
        // letter / custom → a small beveled disc plaque.
        return new THREE.CylinderGeometry(0.42, 0.42, 0.16, 40).rotateX(
          Math.PI / 2
        );
    }
  }, [shape]);
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

  // Ease toward the target slot position for smooth re-layout.
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    if (animate) {
      g.position.lerp(target, Math.min(1, delta * 10));
      const targetScale = selected ? 1.12 : 1;
      g.scale.setScalar(
        THREE.MathUtils.lerp(g.scale.x, targetScale, Math.min(1, delta * 12))
      );
    } else {
      g.position.copy(target);
      g.scale.setScalar(selected ? 1.12 : 1);
    }
  });

  const color = resolved.material?.color ?? resolved.colorHex;
  const isCharm = resolved.kind === "charm";
  const roughness = resolved.material?.roughness ?? (isCharm ? 0.3 : 0.3);
  const metalness = resolved.material?.metalness ?? (isCharm ? 1 : 0);
  const radius = componentRadiusUnits(resolved.diameterMm);

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
        <mesh geometry={charmGeometry} scale={radius / 0.5}>
          <meshStandardMaterial
            color={color}
            metalness={metalness}
            roughness={roughness}
            envMapIntensity={1.1}
          />
        </mesh>
      ) : (
        <mesh>
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial
            color={color}
            metalness={metalness}
            roughness={roughness}
            envMapIntensity={1}
          />
        </mesh>
      )}

      {/* Selection halo */}
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.35, 0.025, 12, 48]} />
          <meshStandardMaterial
            color={GOLD}
            metalness={0.6}
            roughness={0.3}
            emissive={GOLD}
            emissiveIntensity={0.4}
          />
        </mesh>
      )}
    </group>
  );
}
