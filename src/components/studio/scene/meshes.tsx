"use client";

import { Suspense, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

import type { ResolvedComponent } from "@/lib/studio/derive";
import { componentRadiusUnits } from "@/lib/studio/derive";
import { letterTexture, softShadowTexture, stoneTexture } from "@/lib/studio/textures";
import { charmPhotoName, useCharmModel } from "@/lib/studio/charm-model";
import type { StudioBase } from "@/lib/studio/types";

const GOLD = "#b08d57";

// How far a dragged bead lifts off the ring plane as it follows the finger.
const LIFT_Y = 0.5;

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
    <mesh
      name="soft-shadow"
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.46, 0]}
    >
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

/* ------------------------------------------------------ spring motion --- */
/* Critically-damped smoothing (à la Unity SmoothDamp): organic ease-out with
   no overshoot. `smoothTime` is roughly how long it takes to arrive. Operates
   on a single scalar; we drive the bead's ANGLE around the ring (and radius)
   so beads slide ALONG the string arc instead of cutting across the middle. */
function smoothDampScalar(
  cur: number,
  goal: number,
  vel: { current: number },
  smoothTime: number,
  dt: number
): number {
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = cur - goal;
  const temp = (vel.current + omega * change) * dt;
  vel.current = (vel.current - omega * temp) * exp;
  return goal + (change + temp) * exp;
}

/* ------------------------------------------------------- real 3D model --- */

/** A real 3D charm loaded from a `.glb`: scaled so its longest side is
 *  `targetSize` scene units, and hung from its top so it dangles from the ring
 *  point. Unlike photo charms it is NOT billboarded — orbiting the bracelet
 *  reveals its genuine sides and back. Geometry/materials are shared across
 *  instances (three's clone), so multiple copies stay cheap. */
function GlbCharm({ url, targetSize }: { url: string; targetSize: number }) {
  const { scene } = useGLTF(url);
  const object = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    // Move the model's top-centre to the origin so it hangs from the ring point.
    clone.position.set(-center.x, -box.max.y, -center.z);
    const wrapper = new THREE.Group();
    wrapper.add(clone);
    wrapper.scale.setScalar(targetSize / maxDim);
    return wrapper;
  }, [scene, targetSize]);
  return <primitive object={object} />;
}

/* --------------------------------------------------- component (mesh) ---- */

export function ComponentMesh({
  resolved,
  targetAngle,
  radius,
  selected,
  animate,
  dragUidRef,
  dragPointRef,
  onSelect,
  onDragStart,
}: {
  resolved: ResolvedComponent;
  targetAngle: number;
  radius: number;
  selected: boolean;
  animate: boolean;
  dragUidRef: RefObject<string | null>;
  /** Live ground-plane point under the finger while this bead is dragged. */
  dragPointRef: RefObject<THREE.Vector3 | null>;
  onSelect: (uid: string) => void;
  onDragStart: (uid: string) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const angleRef = useRef(targetAngle);
  const radiusRef = useRef(radius);
  const angleVel = useRef(0);
  const radiusVel = useRef(0);
  const yRef = useRef(0); // vertical lift, damped back to 0 when not dragging
  const scaleRef = useRef(0); // start small so beads gently spring in

  // A real 3D model charm (.glb) hangs on the ring but is NOT billboarded, so
  // orbiting the bracelet reveals its real sides and back.
  const isModel =
    resolved.kind === "charm" &&
    !!resolved.imageUrl &&
    /\.glb$/i.test(resolved.imageUrl);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const dt = animate ? Math.min(delta, 0.045) : 1;
    const draggingFree =
      dragUidRef.current === resolved.uid && dragPointRef.current != null;

    // Yaw-billboard: spin the piece around its vertical axis so its front face
    // always points at the camera; its upright hanging pose is preserved. The
    // camera moves smoothly, so tracking it directly reads as smooth (setting
    // the absolute yaw each frame — the ±π wrap is the same orientation, so no
    // snap). Called in every branch below, once the group's position settles.
    const faceCamera = () => {
      g.rotation.y = Math.atan2(
        state.camera.position.x - g.position.x,
        state.camera.position.z - g.position.z
      );
    };

    // A dragged bead pops a touch as it lifts off the ring.
    const targetScale = draggingFree ? 1.12 : selected ? 1.06 : 1;
    if (!animate) scaleRef.current = targetScale;
    else
      scaleRef.current += (targetScale - scaleRef.current) * Math.min(1, dt * 14);
    g.scale.setScalar(scaleRef.current);

    if (draggingFree) {
      // Leave the ring and follow the finger freely (lifted up), so the bead
      // can travel off the bracelet to the delete bin.
      const p = dragPointRef.current!;
      const f = animate ? Math.min(1, dt * 22) : 1;
      g.position.x += (p.x - g.position.x) * f;
      g.position.z += (p.z - g.position.z) * f;
      g.position.y += (LIFT_Y - g.position.y) * f;
      // Keep the polar refs synced so it springs cleanly back onto the ring if
      // released without deleting.
      angleRef.current = Math.atan2(g.position.z, g.position.x);
      radiusRef.current = Math.hypot(g.position.x, g.position.z);
      yRef.current = g.position.y;
      if (!isModel) faceCamera();
      return;
    }

    // Ring-constrained motion: at rest, or reflowing while another bead drags.
    // Unwrap the goal angle so beads always take the short way around the ring.
    let goalAngle = targetAngle;
    while (goalAngle - angleRef.current > Math.PI) goalAngle -= Math.PI * 2;
    while (goalAngle - angleRef.current < -Math.PI) goalAngle += Math.PI * 2;

    if (!animate) {
      angleRef.current = goalAngle;
      radiusRef.current = radius;
      yRef.current = 0;
    } else {
      angleRef.current = smoothDampScalar(
        angleRef.current,
        goalAngle,
        angleVel,
        0.14,
        dt
      );
      radiusRef.current = smoothDampScalar(
        radiusRef.current,
        radius,
        radiusVel,
        0.16,
        dt
      );
      yRef.current += (0 - yRef.current) * Math.min(1, dt * 12);
    }

    g.position.set(
      Math.cos(angleRef.current) * radiusRef.current,
      yRef.current,
      Math.sin(angleRef.current) * radiusRef.current
    );
    if (!isModel) faceCamera();
  });

  const beadRadius = componentRadiusUnits(resolved.diameterMm);
  const isCharm = resolved.kind === "charm";
  const charmGeometry = useCharmGeometry(resolved);

  // Real-photo charms (a traced outline extruded into 3D with the photo on its
  // faces) when the charm has a /charms/<name>.png asset; else procedural shape.
  const photoName = isCharm ? charmPhotoName(resolved.imageUrl) : null;
  const photoModel = useCharmModel(photoName);

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
      position={[
        Math.cos(targetAngle) * radius,
        0,
        Math.sin(targetAngle) * radius,
      ]}
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
        isModel ? (
          <Suspense fallback={null}>
            <GlbCharm url={resolved.imageUrl!} targetSize={beadRadius * 2.2} />
          </Suspense>
        ) : photoName ? (
          photoModel &&
          (photoModel.isBead ? (
            // Volumetric bead charm (sphere/puff): the photo wrapped on it.
            <mesh geometry={photoModel.geometry} scale={beadRadius * 2.2}>
              <meshStandardMaterial
                map={photoModel.texture}
                metalness={0.25}
                roughness={0.5}
                envMapIntensity={1.3}
              />
            </mesh>
          ) : (
            <mesh geometry={photoModel.geometry} scale={beadRadius * 2.2}>
              {/* caps: the photo (alphaTest gives clean edges + see-through holes) */}
              <meshStandardMaterial
                attach="material-0"
                map={photoModel.texture}
                alphaTest={0.5}
                side={THREE.DoubleSide}
                metalness={0.35}
                roughness={0.45}
                envMapIntensity={1.2}
              />
              {/* extruded edge: antique gold */}
              <meshStandardMaterial
                attach="material-1"
                color="#a8834e"
                metalness={0.9}
                roughness={0.35}
                envMapIntensity={1.2}
              />
            </mesh>
          ))
        ) : (
          <mesh geometry={charmGeometry} scale={beadRadius / 0.5}>
            <meshStandardMaterial
              color={resolved.colorHex}
              map={letterMap ?? undefined}
              metalness={resolved.material?.metalness ?? 1}
              roughness={resolved.material?.roughness ?? 0.32}
              envMapIntensity={1.2}
            />
          </mesh>
        )
      ) : (
        <mesh>
          <sphereGeometry args={[beadRadius, 48, 48]} />
          <meshPhysicalMaterial
            map={stoneMap ?? undefined}
            color="#ffffff"
            metalness={resolved.material?.metalness ?? 0}
            roughness={resolved.material?.roughness ?? 0.25}
            transmission={transmission}
            thickness={beadRadius * 3}
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
        <mesh name="selection-halo" rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[beadRadius * 1.3, 0.02, 12, 64]} />
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
