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
  /** True for round bead charms (a sphere), false for extruded pendants. */
  isSphere: boolean;
};

type Contour = {
  points: [number, number][];
  aspect: number;
  /** Bail-hole position (normalized), so the charm hangs from its loop. */
  anchor?: [number, number];
  /** "sphere" = round bead (threads on the string); else an extruded pendant. */
  shape?: "sphere" | "extrude";
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

export function getCharmModel(name: string): Promise<CharmModel> {
  let promise = cache.get(name);
  if (!promise) {
    promise = (async () => {
      const [contour, texture] = await Promise.all([
        fetch(`/charms/${name}.json`).then((r) => r.json() as Promise<Contour>),
        loadTexture(`/charms/${name}.png`),
      ]);
      const isSphere = contour.shape === "sphere";
      const geometry = isSphere
        ? buildSphere()
        : buildGeometry(contour.points, contour.anchor);
      return { geometry, texture, isSphere };
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
