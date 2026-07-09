"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { ResolvedComponent } from "@/lib/studio/derive";
import { componentRadiusUnits } from "@/lib/studio/derive";
import { letterTexture, softShadowTexture, stoneTexture } from "@/lib/studio/textures";
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
  const isBangle = base?.type === "bangle";
  const isCord = base?.type === "cord";
  const tube = isBangle ? 0.22 : 0.035;
  const color = base?.model3dParams?.color ?? base?.colorHex ?? GOLD;
  const metalness = isCord ? 0.1 : isBangle ? 0.95 : 0.85;
  const roughness = isCord ? 0.7 : 0.3;

  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, tube, 20, 220]} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        envMapIntensity={1.1}
      />
    </mesh>
  );
}

/* -------------------------------------------------- soft ground shadow --- */

export function SoftShadow({ radius }: { radius: number }) {
  const texture = useMemo(() => softShadowTexture(), []);
  const size = radius * 2.6 + 0.6;
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.46, 0]}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.4}
        depthWrite={false}
        color="#000000"
      />
    </mesh>
  );
}

/* ---------------------------------------------------- charm geometries --- */

function extrudeShape(shape: THREE.Shape) {
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    bevelSegments: 3,
  }).center();
}

function heartShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.3);
  s.bezierCurveTo(0, 0.45, -0.25, 0.62, -0.45, 0.35);
  s.bezierCurveTo(-0.72, 0.02, -0.32, -0.28, 0, -0.58);
  s.bezierCurveTo(0.32, -0.28, 0.72, 0.02, 0.45, 0.35);
  s.bezierCurveTo(0.25, 0.62, 0, 0.45, 0, 0.3);
  return s;
}

function starShape(points = 5, outer = 0.55, inner = 0.24): THREE.Shape {
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
  s.absarc(0, 0, 0.52, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0.24, 0, 0.44, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return s;
}

function crossShape(): THREE.Shape {
  const w = 0.16;
  const l = 0.55;
  const s = new THREE.Shape();
  const pts: [number, number][] = [
    [-w, l], [w, l], [w, w], [l, w], [l, -w], [w, -w],
    [w, -l], [-w, -l], [-w, -w], [-l, -w], [-l, w], [-w, w],
  ];
  pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
}

function boltShape(): THREE.Shape {
  const s = new THREE.Shape();
  const pts: [number, number][] = [
    [0.12, 0.55], [-0.3, 0.04], [-0.04, 0.04], [-0.14, -0.55],
    [0.32, 0.06], [0.06, 0.06],
  ];
  pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x, y) : s.lineTo(x, y)));
  s.closePath();
  return s;
}

/** Pick a geometry for a charm from its shape + name (custom charms vary). */
function useCharmGeometry(resolved: ResolvedComponent) {
  const { charmShape, name } = resolved;
  return useMemo(() => {
    switch (charmShape) {
      case "heart":
        return extrudeShape(heartShape());
      case "star":
        return extrudeShape(starShape());
      case "moon":
        return extrudeShape(moonShape());
      case "letter":
        // A round medallion; the initial is applied via a texture map.
        return new THREE.CylinderGeometry(0.5, 0.5, 0.16, 48).rotateX(
          Math.PI / 2
        );
      default: {
        const n = name.toLowerCase();
        if (n.includes("cross")) return extrudeShape(crossShape());
        if (n.includes("lightning") || n.includes("bolt"))
          return extrudeShape(boltShape());
        // A faceted teardrop-ish gem for the remaining custom charms.
        return new THREE.OctahedronGeometry(0.55, 0).scale(0.7, 1, 0.7);
      }
    }
  }, [charmShape, name]);
}

/* --------------------------------------------------- component (mesh) ---- */

export function ComponentMesh({
  resolved,
  position,
  selected,
  animate,
  dragUidRef,
  dragPointRef,
  onSelect,
  onDragStart,
}: {
  resolved: ResolvedComponent;
  position: [number, number, number];
  selected: boolean;
  animate: boolean;
  dragUidRef: RefObject<string | null>;
  dragPointRef: RefObject<THREE.Vector3 | null>;
  onSelect: (uid: string) => void;
  onDragStart: (uid: string) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const dragging =
      dragUidRef.current === resolved.uid && dragPointRef.current;
    const goal = dragging ? dragPointRef.current! : target;

    if (animate) {
      g.position.lerp(goal, Math.min(1, delta * (dragging ? 20 : 8)));
      const scale = dragging ? 1.18 : selected ? 1.08 : 1;
      g.scale.setScalar(
        THREE.MathUtils.lerp(g.scale.x, scale, Math.min(1, delta * 12))
      );
    } else {
      g.position.copy(goal);
      g.scale.setScalar(selected ? 1.08 : 1);
    }
  });

  const radius = componentRadiusUnits(resolved.diameterMm);
  const isCharm = resolved.kind === "charm";
  const charmGeometry = useCharmGeometry(resolved);

  const stoneMap = useMemo(
    () => (isCharm ? null : stoneTexture(resolved.material?.color ?? resolved.colorHex)),
    [isCharm, resolved.material?.color, resolved.colorHex]
  );
  const letterMap = useMemo(
    () =>
      resolved.charmShape === "letter"
        ? letterTexture(resolved.letterValue ?? "A", resolved.colorHex)
        : null,
    [resolved.charmShape, resolved.letterValue, resolved.colorHex]
  );

  const transmission = isCharm
    ? 0
    : resolved.material?.transmission ??
      (resolved.finish === "faceted"
        ? 0.55
        : resolved.finish === "polished"
          ? 0.3
          : 0);

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
            color={resolved.colorHex}
            map={letterMap ?? undefined}
            metalness={resolved.material?.metalness ?? 1}
            roughness={resolved.material?.roughness ?? 0.32}
            envMapIntensity={1.2}
          />
        </mesh>
      ) : (
        <mesh>
          <sphereGeometry args={[radius, 48, 48]} />
          <meshPhysicalMaterial
            map={stoneMap ?? undefined}
            color="#ffffff"
            metalness={resolved.material?.metalness ?? 0}
            roughness={resolved.material?.roughness ?? 0.25}
            transmission={transmission}
            thickness={radius * 3}
            ior={1.5}
            clearcoat={0.3}
            clearcoatRoughness={0.4}
            attenuationColor={resolved.material?.color ?? resolved.colorHex}
            attenuationDistance={1.4}
            envMapIntensity={1.2}
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
