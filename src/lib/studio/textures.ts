import * as THREE from "three";

/**
 * Procedural, client-generated textures used as PLACEHOLDERS until real stone
 * photography is provided. Everything is drawn on a canvas at runtime (no
 * external assets) and cached by key so each stone/letter is built once.
 */

const cache = new Map<string, THREE.CanvasTexture>();

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h.padEnd(6, "0"),
    16
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(
  [r, g, b]: [number, number, number],
  target: number,
  amount: number
): string {
  const m = (c: number) => Math.round(c + (target - c) * amount);
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`;
}

/** A soft, cloudy "marble" texture tinted to the stone color. */
export function stoneTexture(colorHex: string): THREE.CanvasTexture {
  const key = `stone:${colorHex}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rgb = hexToRgb(colorHex);

  ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  ctx.fillRect(0, 0, size, size);

  // Cloudy veins: overlapping soft radial blobs, lighter and darker.
  for (let i = 0; i < 22; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = size * (0.1 + Math.random() * 0.35);
    const lighten = Math.random() > 0.5;
    const tone = lighten ? 255 : 0;
    const amount = 0.12 + Math.random() * 0.22;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, mix(rgb, tone, amount));
    grad.addColorStop(1, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  cache.set(key, texture);
  return texture;
}

/** A metal charm face with an engraved-looking initial. */
export function letterTexture(letter: string, colorHex: string): THREE.CanvasTexture {
  const key = `letter:${letter}:${colorHex}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rgb = hexToRgb(colorHex);

  ctx.fillStyle = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = mix(rgb, 0, 0.4);
  ctx.font = `bold ${size * 0.6}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText((letter || "A").slice(0, 1).toUpperCase(), size / 2, size / 2 + 8);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, texture);
  return texture;
}

/** A radial soft-shadow alpha texture (shared, tinted black at render time). */
export function softShadowTexture(): THREE.CanvasTexture {
  const key = "soft-shadow";
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  grad.addColorStop(0, "rgba(0,0,0,0.85)");
  grad.addColorStop(0.55, "rgba(0,0,0,0.35)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  cache.set(key, texture);
  return texture;
}
