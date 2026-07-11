"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

/**
 * Builds a real 3D charm from a processed photo asset: the traced outline
 * (`/charms/<name>.json`) is extruded into a solid with thickness and a bevel,
 * and the cut-out photo (`/charms/<name>.png`) is mapped onto its faces. So the
 * charm has genuine depth + a gold edge, while the intricate detail (and the
 * see-through holes, via alphaTest) comes from the photograph.
 */

export type CharmModel = {
  geometry: THREE.BufferGeometry;
  texture: THREE.Texture;
  /** True for volumetric bead charms (sphere/puff) → single material, no gold
   *  edge; false for extruded pendants (photo faces + gold edge). */
  isBead: boolean;
};

type Shape3D = "sphere" | "puff" | "extrude";

type Contour = {
  points: [number, number][];
  aspect: number;
  /** Bail-hole position (normalized), so the charm hangs from its loop. */
  anchor?: [number, number];
  /** sphere = round bead; puff = inflated shaped bead (e.g. a heart); else an
   *  extruded pendant. */
  shape?: Shape3D;
};

const cache = new Map<string, Promise<CharmModel>>();

/** Extract the charm asset name from a `/charms/<name>.png` image URL. */
export function charmPhotoName(url: string | null | undefined): string | null {
  const m = url?.match(/\/charms\/([a-z0-9_-]+)\.png$/i);
  return m ? m[1]! : null;
}

async function loadTexture(url: string): Promise<THREE.Texture> {
  const tex = await new THREE.TextureLoader().loadAsync(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function buildGeometry(
  points: [number, number][],
  anchor?: [number, number]
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  // Map the cap faces' XY to the photo's UV bounding box so the picture lands
  // exactly on the silhouette; side walls don't use the texture.
  const capUV = (verts: number[], i: number) =>
    new THREE.Vector2((verts[i * 3]! - minX) / spanX, (verts[i * 3 + 1]! - minY) / spanY);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelSegments: 2,
    steps: 1,
    UVGenerator: {
      generateTopUV: (_g, verts, a, b, c) => [capUV(verts, a), capUV(verts, b), capUV(verts, c)],
      generateSideWallUV: () => [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0, 0),
      ],
    },
  });
  // Anchor the geometry at the bail hole so the charm hangs from its loop (the
  // ring point sits at the hole and the body dangles below). Fall back to the
  // bbox centre when no anchor is available. Depth is centred either way.
  if (anchor) {
    geometry.translate(-anchor[0], -anchor[1], 0);
    geometry.computeBoundingBox();
    const bb = geometry.boundingBox!;
    geometry.translate(0, 0, -(bb.min.z + bb.max.z) / 2);
  } else {
    geometry.center();
  }
  return geometry;
}

/** A unit sphere whose UVs planar-project the front-view photo onto it, so a
 *  round bead charm reads as a ball (front shows the photo, back mirrors it). */
function buildSphere(): THREE.SphereGeometry {
  const g = new THREE.SphereGeometry(0.5, 48, 48);
  const pos = g.attributes.position!;
  const uv = g.attributes.uv!;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, pos.getX(i) + 0.5, pos.getY(i) + 0.5);
  }
  uv.needsUpdate = true;
  return g;
}

function distToSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  let t = l2 > 0 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

/** Inflate the outline into a rounded 3D bead (front + back domes meeting at the
 *  rim), with the photo planar-projected — a "puffy" shaped bead (e.g. a heart)
 *  that reads as volume like the sphere, not a flat coin. */
function buildPuff(points: [number, number][]): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)));
  shape.closePath();
  const flat = new THREE.ShapeGeometry(shape, 18);
  const p = flat.attributes.position!;
  const idx = Array.from(flat.index!.array);
  const V = p.count;

  // Distance of each vertex to the outline → dome height (0 at edge, max centre).
  const dn = new Float32Array(V);
  let maxD = 0;
  for (let i = 0; i < V; i++) {
    const x = p.getX(i), y = p.getY(i);
    let d = Infinity;
    for (let k = 0; k < points.length; k++) {
      const a = points[k]!, b = points[(k + 1) % points.length]!;
      d = Math.min(d, distToSeg(x, y, a[0], a[1], b[0], b[1]));
    }
    dn[i] = d;
    if (d > maxD) maxD = d;
  }
  const PUFF = 0.4;
  const dome = (t: number) => PUFF * Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t)));

  const pos: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  for (const sign of [1, -1]) {
    const base = pos.length / 3;
    for (let i = 0; i < V; i++) {
      const x = p.getX(i), y = p.getY(i);
      pos.push(x, y, sign * dome(maxD > 0 ? dn[i]! / maxD : 0));
      uv.push(x + 0.5, y + 0.5);
    }
    for (let i = 0; i < idx.length; i += 3) {
      // Front keeps winding; back is flipped so its normals face outward.
      if (sign > 0) index.push(base + idx[i]!, base + idx[i + 1]!, base + idx[i + 2]!);
      else index.push(base + idx[i]!, base + idx[i + 2]!, base + idx[i + 1]!);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

export function getCharmModel(name: string): Promise<CharmModel> {
  let promise = cache.get(name);
  if (!promise) {
    promise = (async () => {
      const [contour, texture] = await Promise.all([
        fetch(`/charms/${name}.json`).then((r) => r.json() as Promise<Contour>),
        loadTexture(`/charms/${name}.png`),
      ]);
      const shape = contour.shape ?? "extrude";
      const geometry =
        shape === "sphere"
          ? buildSphere()
          : shape === "puff"
            ? buildPuff(contour.points)
            : buildGeometry(contour.points, contour.anchor);
      return { geometry, texture, isBead: shape !== "extrude" };
    })();
    cache.set(name, promise);
  }
  return promise;
}

/** Load a photo-charm model for `name` (null while loading / when name is null). */
export function useCharmModel(name: string | null): CharmModel | null {
  const [model, setModel] = useState<CharmModel | null>(null);
  useEffect(() => {
    if (!name) {
      setModel(null);
      return;
    }
    let alive = true;
    getCharmModel(name)
      .then((m) => alive && setModel(m))
      .catch(() => alive && setModel(null));
    return () => {
      alive = false;
    };
  }, [name]);
  return model;
}
